# Arpeggiate

A minimalist, headless keyboard shortcut library for JavaScript built from mathematical first principles.

- @arpeggiate/core: Zero-dependency core engine.
- @arpeggiate/react: Headless React bindings; zero bundled components or UI.

## Tech Stack

- Written in TypeScript.
- Callable from JavaScript.
- Works inside a web browser, Electron, Tauri, etc.

### Testing

- Use the tdd skill when implementing a feature, fixing a bug, or resolving a code review feedback.
- Ensure 100% function and line coverage.

## Public API

- Minimalist public API:
  - Define a mapping from keys to action IDs.
  - Be informed when an action ID is invoked.
  - Specify an element inside which the library is active.
  - Filter events which should not be intercepted; useful to filter out input, textarea, etc.
- 100% doc comment coverage.

## Spec

- Each feature must be recorded in [SPEC.md](SPEC.md).
- Spec should define requirements, not implementation details.
- Do not append to the spec; rewrite the entire spec file fresh to ensure it is always fully correct and concise.

## Glossary

- Maintain [GLOSSARY.md](GLOSSARY.md).
- No synonyms; one term per concept.
- Do not use a term before defining it in the Glossary.
