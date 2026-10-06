---
name: project-skill-authoring
description: Use to create, evaluate, or revise an HGA project skill.
---

# Project Skill Authoring

Maintain one provider-neutral HGA skill set with clear responsibilities and tested routing. A skill is not ready merely because its instructions read well; its triggers, boundaries, overlap, and behavior must be evaluated.

## When to use

Use when the user asks to create, revise, consolidate, evaluate, or retire a project skill. Do not use for ordinary code changes unless the change modifies the skill framework itself.

## Procedure

1. Define the capability and a single owner. Write a short trigger describing the task class and a clear non-trigger boundary. Check the HGA Skills Registry and every related skill before drafting.
2. Check whether an existing skill should be extended instead of adding a sibling. Specify primary and secondary responsibilities, authority boundaries, dependencies, and likely trigger conflicts before writing.
3. Research the named official/primary upstreams only. Pin the commit SHA and license; identify exact source files/skills; compare behavior rather than copying a full catalog. Record what was adopted, changed, rejected, and why in the HGA registry. Inspect third-party scripts before any execution; avoid them when prose/patterns suffice.
4. Draft provider-neutral core guidance with progressive disclosure. Keep the root `SKILL.md` actionable and focused; add reference files only for substantial material that is not needed on every activation. Add scripts only when deterministic repeat use justifies maintenance and security review.
5. Include procedure, completion criteria, examples, non-triggers, failure modes, verification, and links to related skills. Do not create a general router that duplicates the registry or a competing methodology.
6. Add evaluation cases before declaring the skill ready:
   - Positive trigger tests: representative prompts that should activate it.
   - Negative trigger tests: adjacent prompts that should activate another skill or none.
   - Overlap/conflict tests: ambiguous prompts with one primary owner and named supporting skills.
   - Examples and failure-mode checks that verify the procedure changes behavior.
7. Run the relevant tests. When safe and available, compare a baseline without the skill to the candidate with the skill on the same prompts; use small, discriminative cases and assess outputs against explicit assertions. Do not spend large token budgets on repeated open-ended evaluations.
8. For every change, validate frontmatter, skill name, referenced files, duplicates, and HGA registry entries. Run the Claude/Codex parity checker. Review the final diff and preserve unrelated work.
9. Update the canonical `.agents/skills` source and regenerate the Claude Code mirror with `node scripts/hga-skills-parity.mjs --sync`; verify with `--check`. Never edit only one provider copy.

## Required test set

At minimum include: one positive trigger, one nearby negative trigger, one overlap prompt, one prompt that demonstrates the procedure, and one failure-mode check. For high-impact skills, include additional task-specific cases and compare candidate behavior against the previous version where feasible.

## Failure modes

- Installing a whole upstream collection instead of selecting relevant patterns.
- Adding another router, memory system, or duplicate skill for an existing responsibility.
- Writing vague descriptions that trigger on broad keywords or omit non-triggers.
- Copying scripts or prose without pinned provenance, license, review, or adaptation notes.
- Treating provider mirror equality as proof of equivalent runtime behavior.
- Calling a skill complete without positive, negative, conflict, and regression checks.
- Running third-party scripts before inspection or installing dependencies without justification.
