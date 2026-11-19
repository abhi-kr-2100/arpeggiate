# GLOSSARY.md — Arpeggiate Terminology & Conceptual Lexicon

## Keyboard Grammar Hierarchy

Keyboard shortcuts in Arpeggiate follow a strict structural hierarchy: Key -> Stroke -> Sequence

### Key

- An individual key identifier (e.g. `"a"`, `"Enter"`, `"Escape"`, `"Control"`, `"Shift"`, `"Space"`, `"+"`).
- All keys are symmetric; modifier keys possess no special status.

### Stroke

- A non-empty set of keys pressed simultaneously (e.g. `{"g"}`, `{"Control", "s"}`).
- Key order is invariant within a stroke.
- Supports any finite number of keys $N \ge 1$.

### Sequence

- An ordered succession of one or more strokes (e.g. `"g g"`, `"Control+k Control+s"`).
- Executed in sequential progression.

## Parser Concepts

- **Stroke Delimiter**: The character (`+`) separating concurrent Keys within a Stroke.
- **Sequence Delimiter**: One or more whitespace characters separating consecutive Strokes within a Sequence.
- **Sequence String**: A serialized string representation of a Sequence adhering to Stroke Delimiter and Sequence Delimiter syntax, with optional leading and trailing whitespace.
- **Parser**: The subsystem that validates a Sequence String and transforms it into a Sequence.
- **Compile-Time Parsing**: Static verification and transformation of a Sequence String literal at compile time via the type system.
- **Runtime Parsing**: Dynamic verification and transformation of a Sequence String during program execution.

## System Concepts

- **Action ID**: A unique string identifier representing an application operation.
- **Action Handler**: A callback function invoked with an Action ID when its associated Sequence is matched.
- **Shortcut**: A mapping from a Sequence to an Action ID.
- **Shortcut Map**: A collection of Shortcuts.
- **Conflicting Actions**: A condition where bound Sequences share a prefix relationship such that one Sequence is a proper prefix of another (e.g. `"g"` and `"g g"`).
- **Scope**: The DOM Element within which keyboard events are observed.
- **Held Keys**: The set of keys currently depressed.
- **Sequence State**: The recognized prefix of strokes in an ongoing Sequence.
- **State Reset**: An operation that clears Held Keys and Sequence State to their initial empty values.
- **Engine**: The headless state machine that observes keyboard events within a Scope, tracks Sequences against a Shortcut Map, and informs Action Handlers when an Action ID is invoked.
- **Event Filter**: A predicate function evaluated on an incoming keyboard event to determine whether the Engine must ignore the event.
