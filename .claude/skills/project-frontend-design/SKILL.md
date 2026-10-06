---
name: project-frontend-design
description: Use to set visual direction before building a frontend.
---

# Project Frontend Design

Own visual direction and experience decisions for frontend work. This skill does not own frontend architecture, component implementation, or reusable token-system maintenance; use `project-codebase-design`, `project-tdd`, and `project-design-system` for those responsibilities.

## When to use

Use before building or substantially redesigning a website, landing page, dashboard, application shell, or other UI surface when visual direction, hierarchy, or experience needs to be decided.

Do not use for backend-only work, implementation-only requests against an already-approved design, or token/component-system changes with an established visual direction. Do not use this skill to decide module boundaries or architecture.

## Procedure

1. Discover the brief: clarify purpose, audience, user intent, brand/identity, content, environment, device mix, accessibility needs, performance constraints, and what must remain unchanged. Inspect the current interface and project design evidence before proposing a redesign.
2. Explore directions before committing when the brief is open-ended or high-impact. Offer two or three meaningfully distinct visual concepts, not minor palette variations. For each, state its point of view, composition, typography, color character, imagery/motion approach, and trade-offs. A narrow refinement with a clear incumbent identity does not need artificial alternatives.
3. Compare the directions against the brief and user goals. Recommend one and explain why it fits the audience, product identity, content, and constraints. Do not treat the first generated concept as automatically approved.
4. Define the selected direction in implementation-ready terms: layout/composition and hierarchy; type roles and scale; palette intent; spacing rhythm; imagery/art direction; motion intent and reduced-motion behavior; responsive behavior; accessibility expectations; performance constraints.
5. Pause for user approval when the direction is consequential, the brief is ambiguous, or the work would replace established product identity. Do not make a HUMAN_GATE decision on the user's behalf.
6. Hand the approved direction to `project-design-system` for reusable tokens and component rules. Keep this skill's output about what the experience should look and feel like, not the token naming scheme or application architecture.
7. During implementation, compare the result with the approved direction. When a browser or visual capture is available, inspect representative desktop and mobile states, record mismatches, and refine in bounded passes. Request independent critique for high-visibility work; do not endlessly polish or silently expand scope.

## Design checklist

- Purpose and audience are explicit.
- The direction has a specific rationale rather than generic “modern” styling.
- Composition, typography, color, spacing, imagery, and motion reinforce one another.
- Responsive behavior preserves hierarchy and task completion.
- Accessibility includes semantic structure, keyboard/focus behavior, contrast, and reduced motion.
- Performance constraints shape asset and animation choices.
- Visual work remains separate from architectural decisions.

## Failure modes

- Starting implementation before the visual direction is clear.
- Reusing generic AI-generated layouts, palettes, stock gradients, or decorative motion without a reason tied to the brief.
- Accepting the first concept without comparison or critique when alternatives matter.
- Replacing product copy, identity, or behavior beyond the requested scope.
- Turning direction into a large component architecture; route that work to `project-codebase-design`.
- Repeating token definitions here; route reusable rules to `project-design-system`.

## Handoff

Record the approved direction, alternatives considered (if any), rationale, constraints, and unresolved questions. `project-design-system` can then materialize it; implementation proceeds under the relevant engineering skills.
