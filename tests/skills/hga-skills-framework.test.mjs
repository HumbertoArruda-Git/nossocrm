import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const canonical = path.join(root, '.agents', 'skills');
const mirror = path.join(root, '.claude', 'skills');
const trackedTempDirs = new Set();
function cleanupTrackedTempDirs() {
  for (const dir of trackedTempDirs) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
  trackedTempDirs.clear();
}
process.on('exit', cleanupTrackedTempDirs);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    cleanupTrackedTempDirs();
    process.exit(signal === 'SIGINT' ? 130 : 143);
  });
}
function makeTrackedTempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  trackedTempDirs.add(dir);
  return dir;
}
function removeTrackedTempDir(dir) {
  trackedTempDirs.delete(dir);
  fs.rmSync(dir, { recursive: true, force: true });
}
const expected = [
  'project-security-baseline', 'project-domain-modeling', 'project-codebase-design',
  'project-tdd', 'project-mp-code-review', 'project-diagnosing-bugs', 'project-handoff',
  'project-frontend-design', 'project-design-system', 'project-code-search',
  'project-context-engineering', 'project-skill-authoring',
];

function allFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...allFiles(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}
function parseFrontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  assert.ok(text.startsWith('---\n'), `${file}: frontmatter must start at byte zero`);
  const end = text.indexOf('\n---\n', 4);
  assert.notEqual(end, -1, `${file}: frontmatter closing fence missing`);
  const fm = text.slice(4, end);
  const keys = fm.split('\n').map((line) => line.match(/^([A-Za-z-]+):/)?.[1]).filter(Boolean).sort();
  assert.deepEqual(keys, ['description', 'name'], `${file}: keep frontmatter provider-neutral`);
  const name = fm.match(/^name:\s*([a-z0-9-]+)\s*$/m)?.[1];
  const description = fm.match(/^description:\s*(.+)\s*$/m)?.[1];
  assert.ok(name, `${file}: name missing or invalid`);
  assert.ok(description && description.length > 20, `${file}: description/trigger is missing or too short`);
  assert.ok(description.length <= 60, `${file}: description exceeds 60 characters and may be truncated in agent skill routing`);
  assert.ok(text.slice(end + 5).trim().length > 0, `${file}: body is empty`);
  return { name, text };
}

test('exactly the 12 HGA capabilities exist in the shared canonical directory', () => {
  assert.deepEqual(fs.readdirSync(canonical).filter((name) => name.startsWith('project-')).sort(), [...expected].sort());
  assert.equal(fs.existsSync(path.join(root, '.codex', 'skills')), false, 'do not create a second Codex directory convention alongside .agents/skills');
});

test('every skill has valid minimal portable frontmatter and its name matches its folder', () => {
  const names = new Set();
  for (const skill of expected) {
    const file = path.join(canonical, skill, 'SKILL.md');
    assert.ok(fs.existsSync(file), `${skill} needs SKILL.md`);
    const parsed = parseFrontmatter(file);
    assert.equal(parsed.name, skill);
    assert.ok(!names.has(parsed.name), `duplicate skill name ${parsed.name}`);
    names.add(parsed.name);
  }
});

test('the seven pre-existing HGA authorities retain their core rules', () => {
  const markers = {
    'project-security-baseline': ['Staging primeiro', 'Nada em produção'],
    'project-domain-modeling': ['Challenge against the glossary', 'Update CONTEXT.md inline'],
    'project-codebase-design': ['deep modules', 'The deletion test'],
    'project-tdd': ['Red before green', 'pre-agreed seams'],
    'project-mp-code-review': ['Standards', 'Spec'],
    'project-diagnosing-bugs': ['red-capable', 'feedback loop'],
    'project-handoff': ['handoff document', 'Redact'],
  };
  for (const [skill, required] of Object.entries(markers)) {
    const text = fs.readFileSync(path.join(canonical, skill, 'SKILL.md'), 'utf8');
    for (const phrase of required) assert.ok(text.toLowerCase().includes(phrase.toLowerCase()), `${skill} lost HGA rule: ${phrase}`);
  }
});

test('handoff requires approval for the exact destination before saving', () => {
  const text = fs.readFileSync(path.join(canonical, 'project-handoff', 'SKILL.md'), 'utf8');
  assert.ok(text.includes('A request to prepare a handoff authorizes drafting only, not file creation.'));
  assert.ok(text.includes('Ask for explicit approval of the exact destination before persisting.'));
  assert.ok(text.includes('Never write to the OS temporary directory by default.'));
});

test('handoff does not invent repository status or missing conversation facts', () => {
  const text = fs.readFileSync(path.join(canonical, 'project-handoff', 'SKILL.md'), 'utf8');
  assert.ok(text.includes('Never assert branch, commit, or working-tree status unless verified against this exact repository.'));
  assert.ok(text.includes('Label unknowns; do not invent facts to fill a missing conversation or artifact.'));
});

test('handoff verifies repo metadata and avoids identity leakage', () => {
  const text = fs.readFileSync(path.join(canonical, 'project-handoff', 'SKILL.md'), 'utf8');
  assert.ok(text.includes('Only report branch, commit, or worktree facts after a successful Git command run from this exact project directory.'));
  assert.ok(text.includes('If Git fails, label status unknown; do not inspect .git internals or traverse to the main repository to fill gaps.'));
  assert.ok(text.includes('Never infer or include names, email addresses, or other personal identifiers from account or session metadata.'));
});

test('bug diagnosis never authorizes production instrumentation without a separate gate', () => {
  const text = fs.readFileSync(path.join(canonical, 'project-diagnosing-bugs', 'SKILL.md'), 'utf8');
  assert.ok(text.includes('This skill never authorizes production instrumentation; obtain separate explicit authorization and pass the applicable HUMAN_GATE first.'));
});

test('all relative Markdown references resolve within the skill package', () => {
  for (const skill of expected) {
    const dir = path.join(canonical, skill);
    for (const file of allFiles(dir).filter((p) => p.endsWith('.md'))) {
      const text = fs.readFileSync(file, 'utf8').split('```').filter((_, index) => index % 2 === 0).join('');
      for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const href = match[1].split('#')[0];
        if (!href || href.startsWith('http:') || href.startsWith('https:') || href.startsWith('mailto:') || href.startsWith('#')) continue;
        assert.ok(fs.existsSync(path.resolve(path.dirname(file), href)), `${file}: unresolved reference ${href}`);
      }
    }
  }
});

test('routing evaluation includes positive, negative, and conflict cases with one primary owner', () => {
  const cases = JSON.parse(fs.readFileSync(path.join(root, 'tests/skills/hga-skills-routing-cases.json'), 'utf8'));
  const names = new Set(expected);
  assert.equal(cases.positive.length, 12, 'one positive trigger per HGA capability');
  assert.equal(cases.negative.length, 6, 'keep adjacent negative-trigger cases');
  assert.equal(cases.conflicts.length, 4, 'keep ambiguous/conflict cases');
  assert.deepEqual([...new Set(cases.positive.map((item) => item.primary))].sort(), [...expected].sort(), 'each HGA skill needs a positive trigger');
  const prompts = [...cases.positive, ...cases.negative, ...cases.conflicts].map((item) => item.prompt);
  assert.equal(new Set(prompts).size, prompts.length, 'routing prompts must be distinct');
  for (const category of ['positive', 'negative', 'conflicts']) {
    assert.ok(cases[category].length > 0, `${category} cases required`);
    for (const item of cases[category]) {
      assert.ok(item.prompt && item.prompt.trim(), `${category}: prompt required`);
      assert.ok(names.has(item.primary), `${category}: unknown primary ${item.primary}`);
      for (const secondary of item.secondary ?? []) assert.ok(names.has(secondary), `unknown secondary ${secondary}`);
      for (const blocked of item.must_not ?? []) assert.ok(names.has(blocked), `unknown negative trigger ${blocked}`);
      assert.ok(!(item.secondary ?? []).includes(item.primary), `${category}: primary cannot also be secondary`);
    }
  }
  for (const item of cases.negative) assert.ok(item.must_not?.length, 'negative tests need an explicit skill that must not own the prompt');
  for (const item of cases.conflicts) assert.ok(item.rule?.length > 20, 'conflict cases need an explicit authority-resolution rule');
});

test('handoff remains explicit-only in both runtimes using minimal adapters', () => {
  const codexAdapter = path.join(canonical, 'project-handoff', 'agents', 'openai.yaml');
  assert.ok(fs.existsSync(codexAdapter), 'Codex Handoff adapter required');
  assert.ok(fs.readFileSync(codexAdapter, 'utf8').includes('allow_implicit_invocation: false'));
  const claudeSkill = fs.readFileSync(path.join(mirror, 'project-handoff', 'SKILL.md'), 'utf8');
  assert.ok(claudeSkill.split('---')[1].includes('disable-model-invocation: true'));
  const adapters = allFiles(canonical).filter((file) => file.endsWith(path.join('agents', 'openai.yaml'))).map((file) => path.relative(canonical, file).replaceAll(path.sep, '/'));
  assert.deepEqual(adapters, ['project-handoff/agents/openai.yaml'], 'only Handoff needs runtime-specific behavior metadata');
});

test('HGA shared skill contents match after applying the documented Handoff runtime adapter', () => {
  assert.ok(fs.existsSync(mirror), 'Claude Code mirror must exist');
  const parity = (base) => {
    const out = new Map();
    for (const skill of expected) {
      for (const file of allFiles(path.join(base, skill))) {
        const relative = path.relative(path.join(base, skill), file).split(path.sep).join('/');
        if (relative === 'agents/openai.yaml') continue;
        out.set(path.relative(path.join(base, skill), file).replaceAll('\\', '/'), fs.readFileSync(file));
        out.set(`${skill}/${path.relative(path.join(base, skill), file).replaceAll('\\', '/')}`, fs.readFileSync(file));
      }
    }
    return out;
  };
  const a = parity(canonical), b = parity(mirror);
  assert.deepEqual([...a.keys()].sort(), [...b.keys()].sort());
  for (const [key, bytes] of a) {
    let other = b.get(key);
    if (key === 'project-handoff/SKILL.md') {
      const lf = String.fromCharCode(10);
      other = Buffer.from(other.toString('utf8').split(lf).filter((line) => line !== 'disable-model-invocation: true').join(lf));
    }
    assert.ok(bytes.equals(other), `content drift in ${key}`);
  }
});

test('parity check rejects an OpenAI invocation policy placed outside the policy block', () => {
  const tempRoot = makeTrackedTempDir('hga-policy-scope-');
  try {
    fs.cpSync(canonical, path.join(tempRoot, '.agents', 'skills'), { recursive: true });
    fs.cpSync(mirror, path.join(tempRoot, '.claude', 'skills'), { recursive: true });
    const adapter = path.join(tempRoot, '.agents', 'skills', 'project-handoff', 'agents', 'openai.yaml');
    const lf = String.fromCharCode(10);
    fs.writeFileSync(adapter, ['interface:', '  display_name: "Project Handoff"', '  allow_implicit_invocation: false', 'policy:', '  allow_implicit_invocation: true', ''].join(lf));
    const isolatedScript = path.join(tempRoot, 'scripts', 'hga-skills-parity.mjs');
    fs.mkdirSync(path.dirname(isolatedScript), { recursive: true });
    fs.copyFileSync(path.join(root, 'scripts', 'hga-skills-parity.mjs'), isolatedScript);
    const result = spawnSync(process.execPath, [isolatedScript, '--check'], { cwd: tempRoot, encoding: 'utf8' });
    assert.notEqual(result.status, 0, 'a similarly named field outside policy must not satisfy validation');
    assert.match(result.stderr, /Codex Handoff adapter/);
  } finally {
    removeTrackedTempDir(tempRoot);
  }
});

test('sync refuses mirror symlinks before writing outside the project tree', (t) => {
  const tempRoot = makeTrackedTempDir('hga-skills-symlink-');
  const protectedFile = path.join(path.dirname(tempRoot), `${path.basename(tempRoot)}-protected.txt`);
  try {
    fs.cpSync(canonical, path.join(tempRoot, '.agents', 'skills'), { recursive: true });
    fs.cpSync(mirror, path.join(tempRoot, '.claude', 'skills'), { recursive: true });
    fs.writeFileSync(protectedFile, 'preserve outside target');
    const target = path.join(tempRoot, '.claude', 'skills', 'project-code-search', 'SKILL.md');
    fs.unlinkSync(target);
    try {
      fs.symlinkSync(protectedFile, target, 'file');
    } catch (error) {
      t.skip(`file symlinks unavailable: ${error.message}`);
      return;
    }
    const isolatedScript = path.join(tempRoot, 'scripts', 'hga-skills-parity.mjs');
    fs.mkdirSync(path.dirname(isolatedScript), { recursive: true });
    fs.copyFileSync(path.join(root, 'scripts', 'hga-skills-parity.mjs'), isolatedScript);
    const result = spawnSync(process.execPath, [isolatedScript, '--sync'], { cwd: tempRoot, encoding: 'utf8' });
    assert.notEqual(result.status, 0, 'sync must refuse symbolic links in generated paths');
    assert.match(`${result.stdout}\\n${result.stderr}`, /symlink|symbolic|refus/i);
    assert.equal(fs.readFileSync(protectedFile, 'utf8'), 'preserve outside target');
  } finally {
    removeTrackedTempDir(tempRoot);
    fs.rmSync(protectedFile, { force: true });
  }
});

test('sync refuses stale mirror files without overwriting or deleting local content', () => {
  const tempRoot = makeTrackedTempDir('hga-skills-parity-');
  try {
    fs.cpSync(canonical, path.join(tempRoot, '.agents', 'skills'), { recursive: true });
    fs.cpSync(mirror, path.join(tempRoot, '.claude', 'skills'), { recursive: true });
    const target = path.join(tempRoot, '.claude', 'skills', 'project-code-search', 'SKILL.md');
    fs.appendFileSync(target, '<!-- local draft -->\\n');
    const before = fs.readFileSync(target, 'utf8');
    const stale = path.join(tempRoot, '.claude', 'skills', 'project-code-search', 'stale.md');
    fs.writeFileSync(stale, 'preserve me\\n');
    const isolatedScript = path.join(tempRoot, 'scripts', 'hga-skills-parity.mjs');
    fs.mkdirSync(path.dirname(isolatedScript), { recursive: true });
    fs.copyFileSync(path.join(root, 'scripts', 'hga-skills-parity.mjs'), isolatedScript);
    const result = spawnSync(process.execPath, [isolatedScript, '--sync'], { cwd: tempRoot, encoding: 'utf8' });
    assert.notEqual(result.status, 0, 'sync must refuse stale mirror content');
    assert.match(`${result.stdout}\\n${result.stderr}`, /stale|refus/i);
    assert.equal(fs.readFileSync(target, 'utf8'), before, 'failed preflight must not overwrite the mirror');
    assert.equal(fs.readFileSync(stale, 'utf8'), 'preserve me\\n', 'sync must not delete stale files');
  } finally {
    removeTrackedTempDir(tempRoot);
  }
});
