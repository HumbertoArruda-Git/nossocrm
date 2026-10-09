# HGA Skills Framework V2

## Canonical layout and parity

The canonical, provider-neutral skill contents live in `.agents/skills/project-*`, the repository-scoped Codex/OpenAI location specified by the current Codex skills guide. The user-level `.codex/skills` tree is separate and is not copied or changed. Claude Code receives a generated mirror in `.claude/skills/project-*`; shared files are equivalent, with one documented Handoff runtime adapter. Runtime references: https://developers.openai.com/codex/skills/ and https://code.claude.com/docs/en/skills. Both project paths were exercised with local CLI smoke tests. Run `node scripts/hga-skills-parity.mjs --sync` after editing canonical skills and `node scripts/hga-skills-parity.mjs --check` in validation. The sync command refuses stale mirror-only files/directories and symlinks before writing; it never deletes stale content, which requires separate review and explicit cleanup. Do not create `.codex/skills` alongside the canonical `.agents/skills`. The mirror is mechanical; matching files do not by themselves prove equal activation or behavior in both runtimes.

## HGA Skills Registry

Upstream SHA means the exact upstream repository commit audited for this V2. Internal HGA skill sources were available as local Claude Code skills without a versioned repository or commit metadata; no SHA is claimed for those sources. New skills use only the named source patterns, not complete upstream collections or third-party scripts.

### Existing HGA authorities retained

1. `project-security-baseline`
   - Responsibility: HGA security policy and security review/remediation workflow for web/Supabase projects.
   - Trigger: security audit/review, auth, RLS, grants, storage, secrets, production readiness, or security-sensitive changes.
   - Non-trigger: routine UI or domain design without security implications.
   - Upstream/version/SHA/license: HGA internal `security-baseline`; local source had no version/SHA/license metadata. No external replacement.
   - Dependencies: its four bundled HGA references (AI instructions, checklist, audit runbook, playbook).
   - Related/conflicts: `project-mp-code-review` may provide an independent code-diff review; this skill owns security policy and gates.
   - Claude/Codex: same content in the project-native skill directories; runtime authorization gates remain in force.

2. `project-domain-modeling`
   - Responsibility: clarify domain concepts, glossary, bounded contexts, and durable domain decisions.
   - Trigger: changing terminology/model relationships, CONTEXT documentation, or domain ADRs.
   - Non-trigger: merely reading existing domain vocabulary or choosing code/module seams.
   - Upstream/version/SHA/license: HGA internal `domain-modeling`; local source had no version/SHA/license metadata.
   - Dependencies: bundled HGA context/ADR format references when writing those artifacts.
   - Related/conflicts: `project-codebase-design` owns module/interface design; domain modeling owns business meaning.
   - Claude/Codex: provider-neutral core mirrored by the parity script.

3. `project-codebase-design`
   - Responsibility: design module interfaces, depth, seams, leverage, locality, and testability.
   - Trigger: architecture/module boundaries, API/interface design, or codebase restructuring.
   - Non-trigger: visual direction, semantic business glossary alone, or implementation under an already-set interface.
   - Upstream/version/SHA/license: HGA internal `codebase-design`; local source had no version/SHA/license metadata. Compared with Superpowers brainstorming/planning; kept as the HGA architecture authority rather than adding a competing planner.
   - Dependencies: bundled deepening and design-it-twice references.
   - Related/conflicts: `project-domain-modeling` for business semantics; `project-tdd` for behavior tests.
   - Claude/Codex: provider-neutral core mirrored by the parity script.

4. `project-tdd`
   - Responsibility: behavior-first red/green/refactor implementation discipline.
   - Trigger: feature behavior, bug fix, refactor, or integration test where behavior changes.
   - Non-trigger: investigation before a cause is known, or explicitly disposable/generated artifacts where the user approves an exception.
   - Upstream/version/SHA/license: HGA internal `tdd`; local source had no version/SHA/license metadata. Compared with Superpowers `test-driven-development` at `obra/superpowers` SHA `8ca22dba9a94f28898bbce59f2537ff4d87c747d` (MIT). Preserve HGA seam confirmation, behavior tests, and red/green requirements; do not install the upstream router.
   - Dependencies: bundled HGA testing and mocking references.
   - Related/conflicts: `project-diagnosing-bugs` owns diagnosis/reproduction; TDD owns the verified fix. `project-mp-code-review` owns review/refactoring after green.
   - Claude/Codex: provider-neutral core mirrored by the parity script.

5. `project-mp-code-review`
   - Responsibility: independent two-axis review (documented standards and originating spec) from a pinned comparison point.
   - Trigger: review a diff, branch, PR, or in-progress change.
   - Non-trigger: implementing a feature or diagnosing an unlocalized runtime bug.
   - Upstream/version/SHA/license: HGA internal `mp-code-review`; local source had no version/SHA/license metadata. Compared with Superpowers `requesting-code-review`, `receiving-code-review`, and `verification-before-completion` at SHA `8ca22dba9a94f28898bbce59f2537ff4d87c747d` (MIT). Keep HGA's side-by-side standards/spec findings; incorporate evidence-based verification and careful response to review feedback.
   - Dependencies: issue/spec and project standards when available; independent reviewer contexts when supported.
   - Related/conflicts: do not let a review subagent replace the HGA two-axis report or claim success without fresh verification.
   - Claude/Codex: shared core. Parallel independent review is preferred when safely available; otherwise run isolated sequential passes without merging their criteria.

6. `project-diagnosing-bugs`
   - Responsibility: systematic evidence-based root-cause diagnosis for defects and performance regressions.
   - Trigger: broken, failing, throwing, incorrect, intermittent, or slow behavior.
   - Non-trigger: a known-scope feature with no reported defect; after diagnosis, hand the fix to `project-tdd`.
   - Upstream/version/SHA/license: HGA internal `diagnosing-bugs`; local source had no version/SHA/license metadata. Compared with Superpowers `systematic-debugging` at SHA `8ca22dba9a94f28898bbce59f2537ff4d87c747d` (MIT). HGA's red-capable feedback loop remains authoritative; adopt root-cause, falsifiable-hypothesis, and regression-verification discipline without weakening its evidence gate.
   - Dependencies: optional bundled HITL loop template; do not run it unless the task requires it and its effects are understood. Production instrumentation is never authorized by this skill alone; require separate explicit authorization and the applicable HUMAN_GATE.
   - Related/conflicts: `project-code-search` is a focused supporting tool, not a competing bug process; `project-tdd` owns the fix test cycle.
   - Claude/Codex: provider-neutral core mirrored by the parity script.

7. `project-handoff`
   - Responsibility: create a standalone, redacted continuation artifact for another agent/session when requested; draft inline by default and save only with explicit approval of the exact destination.
   - Trigger: explicit request for handoff, session transfer, or next-agent briefing.
   - Non-trigger: ordinary in-session context cleanup/compression; use `project-context-engineering`.
   - Upstream/version/SHA/license: HGA internal `handoff`; local source had no version/SHA/license metadata. No external replacement.
   - Dependencies: none; reference existing specs/plans/diffs rather than duplicating them.
   - Related/conflicts: `project-context-engineering` owns active-context quality, not standalone handoff documents. Runtime adapter keeps model invocation disabled until explicitly requested: Codex uses the existing `agents/openai.yaml` policy; Claude Code uses `disable-model-invocation` frontmatter. Cosmetic display labels are not duplicated.
   - Claude/Codex: shared core is equivalent and parity-checked; explicit-only behavior is verified through the two minimal adapters. File creation, OS-temp paths, overwrites, and high-risk destinations require the stated approval gates. Branch, commit, and working-tree facts are included only when verified; unknowns remain labeled.

### New HGA skills

8. `project-frontend-design`
   - Responsibility: decide and justify visual direction before frontend implementation.
   - Trigger: new or substantially redesigned UI where experience, visual identity, or hierarchy is unresolved.
   - Non-trigger: backend-only work, approved-design implementation, token maintenance, or frontend architecture.
   - Upstream/version/SHA/license: Anthropic `skills/frontend-design`, `anthropics/skills` SHA `683bc88e56f3e09ba94f7055977f3d3aa499f202`, Apache-2.0 per skill license. Adapt discovery, distinctive direction, critique, and restrained implementation guidance; no scripts copied.
   - Dependencies: user/product brief and current visual evidence.
   - Related/conflicts: `project-design-system` materializes an approved direction; `project-codebase-design` owns architecture.
   - Claude/Codex: same provider-neutral instructions, mirrored and parity-checked.

9. `project-design-system`
   - Responsibility: turn an approved visual direction into semantic tokens, component language, and reusable UI constraints.
   - Trigger: creating/extending a design system or translating an approved direction into reusable rules.
   - Non-trigger: choosing the visual concept or designing application architecture.
   - Upstream/version/SHA/license: Anthropic `skills/theme-factory`, same SHA `683bc88e56f3e09ba94f7055977f3d3aa499f202`, Apache-2.0 per skill license. Use as a reference for coherent palettes/type; explicitly derive systems rather than limiting output to preset themes.
   - Dependencies: approved direction and existing design artifacts.
   - Related/conflicts: `project-frontend-design` decides direction; this skill owns token/component rules.
   - Claude/Codex: same provider-neutral instructions, mirrored and parity-checked.

10. `project-code-search`
   - Responsibility: narrow, progressive text/structural search and call-site impact mapping.
   - Trigger: locate implementation, usages, imports, patterns, or refactor impact.
   - Non-trigger: primary diagnosis of a reported defect; support `project-diagnosing-bugs` when needed.
   - Upstream/version/SHA/license: MassGen `massgen/skills/file-search/SKILL.md` in `massgen/MassGen` SHA `007bd8579298d7dc3ff2a43c378e27a284902f22`; the skill frontmatter states MIT (repository root license is Apache-2.0). Adapt narrow-first `rg` and AST-aware search with fallback; no upstream scripts or dependencies installed.
   - Dependencies: `rg` available; `ast-grep` is optional and was absent during audit. Use `rg`/existing parsers if absent; do not install automatically.
   - Related/conflicts: discovery support for diagnosis and architecture, not a separate refactoring authority.
   - Claude/Codex: provider-neutral commands and fallback, mirrored and parity-checked.

11. `project-context-engineering`
   - Responsibility: diagnose, select, compress, offload, isolate, and retrieve active task context.
   - Trigger: context is noisy, degraded, oversized, conflicting, or needs selective just-in-time retrieval.
   - Non-trigger: persistent memory-system design or a requested standalone handoff document.
   - Upstream/version/SHA/license: `muratcankoylan/Agent-Skills-for-Context-Engineering` SHA `58b55a8921758d13453b440704fb1b5b208c0b0e` (MIT); selected `context-fundamentals`, `context-degradation`, `context-optimization`, `context-compression`, and `filesystem-context`. Adapt only relevant patterns into the six named phases; omit memory-systems, scripts, and parallel memory storage.
   - Dependencies: project file/search tools; no new runtime package.
   - Related/conflicts: `project-handoff` owns standalone transfer artifacts; no modifications to Obsidian/Jarvis/Hermes memory.
   - Claude/Codex: provider-neutral instructions, mirrored and parity-checked.

12. `project-skill-authoring`
   - Responsibility: create, consolidate, test, and maintain HGA skills with explicit scope and routing.
   - Trigger: a project-skill authoring, revision, evaluation, consolidation, or retirement task.
   - Non-trigger: normal application changes that do not change the skill framework.
   - Upstream/version/SHA/license: Anthropic `skills/skill-creator`, `anthropics/skills` SHA `683bc88e56f3e09ba94f7055977f3d3aa499f202`, Apache-2.0 per skill license. Adapt trigger evaluation, progressive disclosure, and before/after assessment; omit the upstream eval viewer, scripts, and framework.
   - Dependencies: registry, parity script, and small prompt evaluation cases.
   - Related/conflicts: `project-codebase-design` handles software architecture; this skill governs skill artifacts only.
   - Claude/Codex: same provider-neutral authoring process, mirrored and parity-checked.

## TASK → PRIMARY SKILL → SECONDARY SKILLS

| Task / prompt | Primary | Secondary / boundary |
|---|---|---|
| “Há um bug / está falhando / lento” | `project-diagnosing-bugs` | `project-code-search` for targeted navigation; `project-tdd` after root cause is established. |
| “Implemente uma feature” | `project-tdd` | `project-codebase-design` if interfaces/seams change; `project-domain-modeling` only if domain meaning changes; frontend skills only for visual work. |
| “Procure onde esta função é usada” | `project-code-search` | `project-codebase-design` only if the request proceeds to redesign. |
| “Crie uma landing page” | `project-frontend-design` | Explore/compare direction, then `project-design-system`, then implementation under `project-tdd`; visual/browser QA and independent critique follow. |
| “Transforme esta direção aprovada em tokens/componentes” | `project-design-system` | `project-frontend-design` only to resolve an unapproved direction. |
| “Implemente um mockup aprovado sem mudar a direção” | `project-tdd` | No visual direction or token-system change: do not activate frontend-design or design-system as primary; architecture only if interfaces/seams are explicitly changing. |
| “Contexto está enorme/confuso” | `project-context-engineering` | Use `project-handoff` only if a standalone next-session document is explicitly requested. |
| “Crie uma nova skill” | `project-skill-authoring` | `project-mp-code-review` may review the resulting diff, but does not own authoring. |
| “Revise o código / diff” | `project-mp-code-review` | Keep standards and spec findings independent; do not implement review suggestions without verification. |
| “Estamos mudando o significado de cliente/conta” | `project-domain-modeling` | `project-codebase-design` only for resulting module/interface decisions. |
| “Desenhe a interface de um módulo” | `project-codebase-design` | `project-domain-modeling` if business terms/relationships need resolution. |
| “Audite segurança / auth / RLS / secrets” | `project-security-baseline` | `project-mp-code-review` may independently review code; security gate stays primary. |
| “Prepare um handoff para outro agente” | `project-handoff` | `project-context-engineering` can improve retrieval, but does not create a competing artifact. |
| Ambiguous: “arrume esta tela que parece genérica” | `project-frontend-design` | Treat as visual critique/direction; do not assume architecture or token-system ownership unless asked. |
| Ambiguous: “encontre a causa e corrija” | `project-diagnosing-bugs` | Diagnosis first; transition explicitly to `project-tdd` for the fix. |

The primary skill owns the task framing. Secondary skills contribute only their named slice; do not run two competing end-to-end workflows.

## Visual design pipeline

Discovery → visual exploration (multiple directions when useful) → compare against purpose/audience/identity/constraints → justify and select direction → `project-frontend-design` → `project-design-system` → implementation → browser/visual QA when available → independent critique/review → bounded refinement → HUMAN_GATE when required. Do not accept the first generated direction automatically.

## Engineering pipeline

Requirements/context → domain/architecture when needed → isolated branch/worktree → scoped plan → `project-tdd` implementation → `project-diagnosing-bugs` if unexpected behavior appears → evidence-based verification → `project-mp-code-review` → `project-handoff` when requested → HUMAN_GATE for protected actions. Existing HGA autonomy, security, approval, and human-gate rules take precedence.

## Upstream index and exclusions

- Anthropic Skills — URL: `https://github.com/anthropics/skills`; commit `683bc88e56f3e09ba94f7055977f3d3aa499f202`; Apache-2.0 per selected skill. Selected `frontend-design`, `theme-factory`, and `skill-creator`; the wider catalog was not installed.
- Superpowers — URL: `https://github.com/obra/superpowers`; commit `8ca22dba9a94f28898bbce59f2537ff4d87c747d`; MIT. Audited `systematic-debugging`, `test-driven-development`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `brainstorming`, `writing-plans`, `using-git-worktrees`, `subagent-driven-development`, and `dispatching-parallel-agents`. Selective patterns only; no framework router, scripts, or duplicate skills installed.
- Agent Skills for Context Engineering — URL: `https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering`; commit `58b55a8921758d13453b440704fb1b5b208c0b0e`; MIT. Selected only the five context skills listed above; no collection install.
- MassGen — URL: `https://github.com/massgen/MassGen`; commit `007bd8579298d7dc3ff2a43c378e27a284902f22`; root Apache-2.0; the audited `massgen/skills/file-search/SKILL.md` states MIT. Used search strategy concepts only; no upstream script/dependency installed.
- Deliberately not installed: Superpowers as a whole; `algorithmic-art`, `canvas-design`, `web-artifacts-builder`, `memory-systems`, `hosted-agents`, `bdi-mental-states`, `self-improvement-loops`, and `advanced-evaluation`; remaining Context Engineering skills; any parallel router or second memory system.
