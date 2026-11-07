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
