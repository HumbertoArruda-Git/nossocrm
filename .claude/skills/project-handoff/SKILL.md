---
name: project-handoff
description: Use to create a standalone handoff for another agent.
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work.

A request to prepare a handoff authorizes drafting only, not file creation. Never write to the OS temporary directory by default. Ask for explicit approval of the exact destination before persisting. If the user has not asked for a saved file and supplied a destination, present the draft inline and ask. Never overwrite or delete a file without separate explicit approval; do not write to production, secrets, or other high-risk locations without the applicable HUMAN_GATE.

Never assert branch, commit, or working-tree status unless verified against this exact repository. Only report branch, commit, or worktree facts after a successful Git command run from this exact project directory. If Git fails, label status unknown; do not inspect .git internals or traverse to the main repository to fill gaps. Label unknowns; do not invent facts to fill a missing conversation or artifact. Never infer or include names, email addresses, or other personal identifiers from account or session metadata.

Include a "suggested skills" section in the document, naming the skills relevant to the next agent's task.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
