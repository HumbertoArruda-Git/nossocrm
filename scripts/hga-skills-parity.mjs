#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonical = path.join(root, '.agents', 'skills');
const mirror = path.join(root, '.claude', 'skills');
const mode = process.argv[2] ?? '--check';
if (!['--check', '--sync'].includes(mode)) {
  console.error('Usage: node scripts/hga-skills-parity.mjs [--check|--sync]');
  process.exit(2);
}

function skillDirs(base) {
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('project-'))
    .map((entry) => entry.name)
    .sort();
}
function filesUnder(dir) {
  const result = new Map();
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const [relative, bytes] of filesUnder(full)) result.set(path.join(entry.name, relative), bytes);
    } else if (entry.isFile()) {
      result.set(entry.name, fs.readFileSync(full));
    }
  }
  return result;
}

function coreFiles(dir) {
  const result = filesUnder(dir);
  result.delete(path.join('agents', 'openai.yaml'));
  return result;
}
function normalizeClaude(name, relative, bytes) {
  if (name !== 'project-handoff' || relative !== 'SKILL.md') return bytes;
  const lf = String.fromCharCode(10);
  return Buffer.from(bytes.toString('utf8').split(lf).filter((line) => line !== 'disable-model-invocation: true').join(lf));
}
function policyDisablesImplicitInvocation(text) {
  let inPolicy = false;
  let policyHeaders = 0;
  const values = [];
  const lf = String.fromCharCode(10);
  const cr = String.fromCharCode(13);
  for (const raw of text.split(lf)) {
    const line = raw.endsWith(cr) ? raw.slice(0, -1) : raw;
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;
    if (indent === 0) {
      inPolicy = trimmed === 'policy:';
      if (inPolicy) policyHeaders += 1;
      continue;
    }
    if (inPolicy && indent === 2 && trimmed.startsWith('allow_implicit_invocation:')) values.push(trimmed);
  }
  return policyHeaders === 1 && values.length === 1 && values[0] === 'allow_implicit_invocation: false';
}
function addClaudeHandoffAdapter(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lf = String.fromCharCode(10);
  const closing = text.indexOf(`${lf}---${lf}`, 4);
  if (closing < 0) throw new Error(`Invalid SKILL.md frontmatter: ${file}`);
  const frontmatter = text.slice(0, closing).split(lf);
  if (frontmatter.includes('disable-model-invocation: true')) return;
  writeFileNoFollow(file, `${text.slice(0, closing)}${lf}disable-model-invocation: true${text.slice(closing)}`);
}
function symlinksUnder(dir) {
  let stat;
  try {
    stat = fs.lstatSync(dir);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  if (stat.isSymbolicLink()) return [dir];
  if (!stat.isDirectory()) return [];
  const links = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) links.push(full);
    else if (entry.isDirectory()) links.push(...symlinksUnder(full));
  }
  return links;
}

function isSymlinkPath(file) {
  try {
    return fs.lstatSync(file).isSymbolicLink();
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function assertSafePath(candidate) {
  const relative = path.relative(root, candidate);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Refusing path outside project root: ${candidate}`);
  }
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let stat;
    try {
      stat = fs.lstatSync(current);
    } catch (error) {
      if (error.code === 'ENOENT') break;
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`Refusing path through symbolic link: ${current}`);
  }
}

function ensureSafeDirectory(dir) {
  const relative = path.relative(root, dir);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Refusing directory outside project root: ${dir}`);
  }
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      fs.mkdirSync(current);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`Refusing unsafe directory path: ${current}`);
    }
  }
}

function writeFileNoFollow(file, bytes) {
  assertSafePath(file);
  const noFollow = fs.constants.O_NOFOLLOW ?? 0;
  const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_CREAT | noFollow, 0o666);
  try {
    const opened = fs.fstatSync(fd);
    if (!opened.isFile()) throw new Error(`Refusing non-regular destination: ${file}`);
    assertSafePath(path.dirname(file));
    const resolved = fs.realpathSync(file);
    const relative = path.relative(root, resolved);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error(`Refusing resolved destination outside project root: ${resolved}`);
    }
    const current = fs.statSync(resolved);
    if (current.dev !== opened.dev || current.ino !== opened.ino) {
      throw new Error(`Destination changed while opening: ${file}`);
    }
    fs.ftruncateSync(fd, 0);
    fs.writeFileSync(fd, bytes);
  } finally {
    fs.closeSync(fd);
  }
}

const unsafeLinks = [
  ...[path.join(root, '.agents'), path.join(root, '.claude')].filter(isSymlinkPath),
  ...symlinksUnder(canonical),
  ...symlinksUnder(mirror),
];
if (unsafeLinks.length) {
  const lf = String.fromCharCode(10);
  console.error(`Refusing to read or write through symbolic links:${lf}${unsafeLinks.join(lf)}`);
  process.exit(1);
}

const sourceNames = skillDirs(canonical);
if (!sourceNames.length || sourceNames.some((name) => !fs.existsSync(path.join(canonical, name, 'SKILL.md')))) {
  console.error('Canonical .agents/skills/project-* set is missing or has no SKILL.md.');
  process.exit(1);
}
function staleMirrorPaths(names) {
  const stale = [];
  const expectedNames = new Set(names);
  for (const name of skillDirs(mirror)) {
    if (!expectedNames.has(name)) stale.push(`stale skill directory: ${name}`);
  }
  for (const name of names) {
    const expectedFiles = coreFiles(path.join(canonical, name));
    for (const relative of filesUnder(path.join(mirror, name)).keys()) {
      if (!expectedFiles.has(relative)) stale.push(`stale mirror file: ${name}/${relative}`);
    }
  }
  return stale;
}
if (mode === '--sync') {
  const stale = staleMirrorPaths(sourceNames);
  if (stale.length) {
    const lf = String.fromCharCode(10);
    console.error(`Refusing to sync until stale mirror-only content is reviewed; no files were changed:${lf}${stale.join(lf)}`);
    process.exit(1);
  }
  ensureSafeDirectory(mirror);
  for (const name of sourceNames) {
    const source = path.join(canonical, name);
    const target = path.join(mirror, name);
    ensureSafeDirectory(target);
    for (const [relative, bytes] of filesUnder(source)) {
      if (relative.split(path.sep).join('/') === 'agents/openai.yaml') continue;
      const destination = path.join(target, relative);
      ensureSafeDirectory(path.dirname(destination));
      writeFileNoFollow(destination, bytes);
    }
  }
  addClaudeHandoffAdapter(path.join(mirror, 'project-handoff', 'SKILL.md'));
}

const mirrorNames = skillDirs(mirror);
const problems = [];
for (const name of sourceNames) {
  const left = coreFiles(path.join(canonical, name));
  const right = filesUnder(path.join(mirror, name));
  for (const relative of new Set([...left.keys(), ...right.keys()])) {
    const a = left.get(relative);
    const b = right.get(relative);
    if (!a) problems.push(`Claude mirror has extra file: ${name}/${relative}`);
    else if (!b) problems.push(`Claude mirror is missing: ${name}/${relative}`);
    else if (!a.equals(normalizeClaude(name, relative, b))) problems.push(`Claude mirror differs: ${name}/${relative}`);
  }
}
const codexHandoffAdapter = path.join(canonical, 'project-handoff', 'agents', 'openai.yaml');
if (!fs.existsSync(codexHandoffAdapter) || !policyDisablesImplicitInvocation(fs.readFileSync(codexHandoffAdapter, 'utf8'))) {
  problems.push('Codex Handoff adapter must keep implicit invocation disabled in the policy block.');
}
const claudeHandoff = path.join(mirror, 'project-handoff', 'SKILL.md');
if (!fs.existsSync(claudeHandoff) || !fs.readFileSync(claudeHandoff, 'utf8').split('---')[1]?.includes('disable-model-invocation: true')) {
  problems.push('Claude Handoff adapter must keep implicit invocation disabled.');
}
for (const name of mirrorNames) {
  if (!sourceNames.includes(name)) problems.push(`Claude mirror has an HGA project skill with no canonical source: ${name}`);
}
if (problems.length) {
  console.error(problems.join(String.fromCharCode(10)));
  process.exit(1);
}
console.log(`PASS: ${sourceNames.length} HGA skills share the same core; Handoff invocation policy matches across runtimes.`);
