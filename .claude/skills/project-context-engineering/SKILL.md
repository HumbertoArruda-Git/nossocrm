---
name: project-context-engineering
description: Use for oversized, noisy, or conflicting task context.
---

# Project Context Engineering

Keep the active context useful without creating a parallel memory system. Diagnose the context problem before changing it, preserve source artifacts, and retrieve details only when needed. Explicit requests for a standalone next-agent handoff belong to `project-handoff`; this skill owns in-session context management.

## Procedure

### DIAGNOSE

Identify the failure mode: irrelevant accumulation, missing information, stale/conflicting facts, oversized tool output, repeated retrieval, or context degradation. Find the smallest evidence and the user's current task/constraints before compressing or offloading anything. Do not assume that a larger prompt is better.

### SELECT

Load only the instructions, files, decisions, and results relevant to the current step. Prefer targeted search and line-range reads over loading entire directories or logs. Keep project instructions and security constraints visible. Separate verified facts from hypotheses and stale context.

### COMPRESS

When a handoff or continuation summary is needed, preserve explicitly: user intent; decisions and rationale; hard constraints/HUMAN_GATE; relevant file paths and identifiers; current state and branch/worktree; verified tests/results; unresolved risks; and next steps. Mark uncertainty and provenance. Do not convert guesses into facts or drop a constraint merely to shorten the summary. For a user-requested handoff document, use `project-handoff`.

### OFFLOAD

Move large outputs, logs, traces, or verbose findings to an appropriate project artifact or scratch file when retention matters. Keep a short index in active context: artifact path, what it contains, and how to retrieve a narrow section. Do not replace or delete the original source. Avoid writing temporary notes into production or secrets locations.

### ISOLATE

Separate independent investigations into distinct agents/workspaces only when they have clear boundaries, non-overlapping writes, and a useful integration point. Keep high-risk/security decisions under one accountable review path. Do not introduce parallel agents for tightly coupled reasoning or as a substitute for understanding the task.

### RETRIEVE

Retrieve details just in time from the named artifact/source when needed. Verify that the file, branch, and version are still current before acting. Prefer exact excerpts/line ranges and update the summary if new evidence changes a decision or risk.

## Boundaries

- Do not create a new persistent memory store or modify Obsidian, Jarvis, Hermes memory, or another assistant's memory configuration as a side effect.
- Do not edit the user's context or artifacts without an explicit task reason.
- Do not duplicate the handoff document workflow; use `project-handoff` for a requested standalone handoff.
- Do not summarize away safety rules, approval gates, or unresolved uncertainty.

## Verification

Before continuing, confirm the selected context supports the next action, large data remains retrievable from the cited artifact, and all required decisions, constraints, paths, state, risks, and next steps survived compression. If any item is missing, restore it from source rather than guessing.
