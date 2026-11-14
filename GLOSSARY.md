# GLOSSARY.md — Arpeggiate Terminology & Conceptual Lexicon

## Keyboard Grammar Hierarchy

Keyboard shortcuts in Arpeggiate follow a strict structural hierarchy: Key -> Stroke -> Sequence

### Key

The atomic building block of a keyboard shortcut, representing an individual key press.
- **Examples**: `"a"`, `"Enter"`, `"Escape"`, `"Control"`, `"Shift"`, `"+"`, `"AudioVolumeUpBy50"`.

### Stroke

An input event consisting of one or more keys pressed simultaneously.
- **Single-Key Stroke**: A stroke containing exactly one key (e.g. `"g"`, `"Space"`).
- **Multi-Key Stroke**: A stroke containing two or more keys pressed together (e.g. `"Control+s"`, `"Alt+Shift+x"`).

### Sequence

An ordered succession of one or more strokes executed sequentially.
- **Single-Stroke Sequence**: A sequence with only one stroke (e.g. `"Control+k"`, `"Escape"`).
- **Multi-Stroke Sequence**: A sequence with two or more strokes executed in progression (e.g. `"g g"`, `"Control+k Control+s"`, `"Space Space"`).

## System Concepts

- **Action ID**: A unique string identifier representing an application operation.
- **Action Handler**: A callback function invoked with an Action ID when its associated Sequence is matched.
- **Shortcut**: A mapping from a Sequence to an Action ID.
- **Shortcut Map**: A collection of Shortcuts.
- **Scope**: The specified DOM Element within which keyboard events are observed.
- **Event Filter**: A predicate function evaluated on an incoming keyboard event to determine whether the Engine must ignore the event.
- **Held Keys**: The set of keys currently in a depressed state.
- **Active Chord**: The cumulative set of keys depressed during an ongoing stroke gesture.
- **Engine**: The headless state machine that observes keyboard events within a Scope, tracks Sequences against a Shortcut Map, and informs Action Handlers when an Action ID is invoked.
