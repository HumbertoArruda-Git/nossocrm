---
name: project-design-system
description: Use to define tokens from an approved visual direction.
---

# Project Design System

Materialize an approved visual direction as a coherent, reusable system. This skill owns tokens, component language, and cross-surface consistency; `project-frontend-design` owns choosing the direction. Do not use this skill to invent a competing visual concept or to define frontend architecture.

## When to use

Use after a visual direction has been selected, when a new product/system needs a design foundation, or when an existing design system needs scoped extension or normalization.

If no visual direction exists, first use `project-frontend-design` to discover, compare, and approve one. A request to implement an already-approved mockup without changing reusable tokens or component rules is not a design-system task; use `project-tdd` for implementation. For isolated feature implementation under an established system, follow existing tokens rather than redesigning them.

## Procedure

1. Read the approved direction and inspect existing design tokens, components, and representative screens. Distinguish established rules from accidental implementation details.
2. Define semantic color tokens (surface, text, border, action, status, focus), including light/dark or theme variants only when the product requires them. Record contrast expectations and prohibited combinations.
3. Define typography roles, family/fallbacks, scale, line-height, weight, and responsive behavior; spacing and sizing scales; radii; elevation; border treatment; and motion duration/easing/reduced-motion rules.
4. Specify imagery and icon rules, including crop, aspect ratio, density, licensing/source constraints, and when illustration or photography is appropriate.
5. Define the component language: principles for composition, state, density, interaction, content, and reuse. Avoid prescribing component abstractions or code boundaries; those belong to architecture.
6. Define responsive rules from content and task priorities, not device labels alone. Include minimum target sizes, focus visibility, semantic/keyboard expectations, contrast, and reduced motion.
7. Validate the system against representative surfaces and states (default, hover/focus, disabled, error, empty, loading, dense content, narrow viewport). Identify exceptions explicitly instead of silently weakening the system.
8. Document each token/rule with its meaning and intended use. Prefer a small semantic vocabulary; remove duplicate or near-synonym tokens.

## Deliverable

Provide a concise system specification or update the project's existing design-system artifact. Include semantic tokens, typography, spacing/sizing, radius, elevation/borders, motion, imagery, component language, responsive rules, accessibility constraints, and representative validation notes. Do not create an additional design-system document when an authoritative one already exists; update it within the requested scope.

## Non-goals and failure modes

- Do not choose the visual direction; that is `project-frontend-design`.
- Do not create a library of preset themes as the only design method. Theme references are inspiration; derive rules from the approved product direction.
- Do not encode arbitrary raw values where semantic tokens are appropriate.
- Do not generalize one screen's accidental styling into a global rule.
- Do not define module boundaries, application architecture, or frontend implementation plans.
- Do not declare the system complete without checking accessibility, responsive states, and actual component usage.
