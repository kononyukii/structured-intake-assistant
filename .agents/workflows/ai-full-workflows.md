---
description: Default Contribution Workflow
---

## Default Contribution Workflow

Product context for this repository:

- Structured Intake Assistant for Primary Care.
- Focus on collecting and structuring intake information before a primary care visit.
- Do not introduce diagnosis, treatment recommendations, or triage claims.

When asked to implement a task:

1. **Initialize Context**: Always read `docs/spec-v1.md`, `docs/adr/001-product-scope.md`, and `docs/ui/WIREFRAME_SPEC.md` before defining scope or inspecting code.
2. **Define scope** as one PR-sized change (minimal viable improvement).
3. **Choose correct layer** (`app` / `features` / `entities` / `shared`) and do not violate boundaries.
4. **Inspect existing code first** and reuse existing patterns/utilities/components.
5. Implement the minimal solution that meets acceptance criteria.
6. Add **Zod validation** if there is user input.
7. Add **loading/empty states** if it’s a screen-level feature.
8. Ensure baseline design quality:
   - consistent spacing/tokens
   - clear hierarchy
   - interactive states (hover/focus/disabled/loading)
9. Add **tests** when reasonable:
   - unit tests for pure logic/modules
   - e2e only if explicitly requested
10. Do not touch unrelated files; do not change configs; do not add deps.
11. Output your result using the required format:

- Scope
- Files changed
- Acceptance checklist
- Suggested commit message
