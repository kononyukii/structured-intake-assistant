# MVP Fixture Plan

## Goal

Provide consistent mock data (fixtures) for development, UI building, and testing without requiring manual input every time.

## Fixture Types

1. **Empty State**: No symptoms or history recorded.
2. **Standard Intake**: A typical non-urgent respiratory or musculoskeletal complaint.
3. **Complex History**: Multiple chronic conditions and medications.

## Implementation Strategy

- Store fixtures as JSON files in `src/shared/lib/fixtures/`.
- Create a `FixtureProvider` or utility to load these into the local IndexedDB for manual testing.
- Use these fixtures in Playwright/E2E tests to ensure UI renders correctly across scenarios.
