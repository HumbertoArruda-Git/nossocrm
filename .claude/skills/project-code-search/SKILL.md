---
name: project-code-search
description: Use to find code, symbols, call sites, or change impact.
---

# Project Code Search

Find the smallest useful set of repository evidence, then expand only as needed. Search is an investigation aid, not a substitute for reading the callers and behavior before refactoring.

## When to use

Use for requests such as “where is this implemented?”, “find all usages/call sites”, “what imports this?”, or when a planned change requires impact analysis. For a reported bug, `project-diagnosing-bugs` remains primary; use this skill as a focused search step when code navigation is needed.

## Procedure

1. Check available tools without installing anything: `rg --version` and `ast-grep --version` (also check `sg --version` if the binary name may be `sg`). Record unavailable tools and continue with the fallback.
2. Start narrow: use a distinctive symbol, exact phrase, known file type, or likely directory. Prefer repository-aware search that respects ignore rules. Limit output (for example, `rg -n -m 20 'pattern' path/`).
3. Use ripgrep (`rg`) for text, comments, identifiers, configuration, and simple regular expressions. Add file globs and narrower paths before broadening.
4. Use ast-grep when syntactic structure matters (such as finding a call shape, declaration, or language-specific pattern), and constrain language and path. Confirm results by opening the exact files; structural matches can still be semantically irrelevant.
5. If ast-grep is absent, do not install it automatically. Fall back to `rg` with language/file filters, then a parser already present in the project (for example, an existing compiler/AST tool) when appropriate. If no structural parser is available, state the limitation and manually inspect likely call sites.
6. Expand progressively: directory → repository → related configuration/tests/docs. If results are empty, check naming variants, generated-code boundaries, ignored paths, and imports before declaring no callers.
7. Before refactoring, map all callers, exports, tests, dynamic references, configuration hooks, and externally visible entry points. Separate confirmed call sites from likely/heuristic matches.
8. Return a compact evidence summary: search scope and command/tool, key files/line ranges, confirmed callers, uncertain/dynamic references, and what remains unchecked. Store large result sets in an artifact instead of pasting them wholesale.

## Example commands

```sh
rg -n -m 20 'normalizeContact' lib features --glob '*.{ts,tsx}'
ast-grep --lang ts -p 'normalizeContact($$$ARGS)' lib features
```

If the installed ast-grep CLI uses `sg`, use its equivalent syntax. Never treat an unavailable command as a reason to install an unreviewed package.

## Failure modes

- Starting with repository-wide broad searches that flood context.
- Using text search where syntax is decisive, or assuming AST matches prove runtime behavior.
- Refactoring after finding only the definition but not the callers.
- Ignoring dynamic imports, generated sources, aliases, tests, or config-based references.
- Claiming completeness without naming the scope and limitations.
