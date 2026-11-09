# GLOSSARY.md — Arpeggiate Terminology & Conceptual Lexicon

## 1. Keyboard Grammar Hierarchy

Keyboard shortcuts in Arpeggiate follow a strict structural hierarchy: Key -> Stroke -> Sequence

### Key
The atomic building block of a keyboard shortcut, representing an individual physical or logical key press as reported by the browser's `KeyboardEvent.key`.
- **Examples**: `"a"`, `"Enter"`, `"Escape"`, `"Control"`, `"Shift"`, `"+"`, `"AudioVolumeUpBy50"`.
- **Canonical Space**: The browser space key (`" "`) is canonically normalized to `"Space"`.
- **Literal Plus**: The literal plus key is represented as `"+"`.

### Stroke
A single discrete keyboard input event consisting of one or more keys pressed simultaneously within a single physical stroke cycle.
- **Delimiter**: Keys in a multi-key stroke are joined with the `+` character (e.g. `"Control+k"`, `"j+k"`, `"Control++"`).
- **Single-Key Stroke**: A stroke containing exactly one key (e.g. `"g"`, `"Space"`).
- **Multi-Key Stroke**: A stroke containing two or more keys pressed together (e.g. `"Control+s"`, `"Alt+Shift+x"`).
- **Canonical Stroke**: A stroke whose constituent keys are deduplicated and sorted in lexicographical order (e.g., `"k+Control"` normalizes to `"Control+k"`).

### Sequence
An ordered temporal succession of one or more strokes executed sequentially over time.
- **Delimiter**: Strokes in a sequence are separated strictly by whitespace (`" "`).
- **Single-Stroke Sequence**: A sequence with only one stroke (e.g. `"Control+k"`, `"Escape"`).
- **Multi-Stroke Sequence**: A sequence with two or more strokes executed in progression (e.g. `"g g"`, `"Control+k Control+s"`, `"Space Space"`).

### Canonical Form
The deterministic, unique string representation of any key, stroke, or sequence:
1. Spacebar key (`" "`) is normalized to `"Space"`.
2. Stroke keys are deduplicated and sorted lexicographically (e.g. `"k+Control"` -> `"Control+k"`).
3. The literal `+` key is preserved unambiguously (e.g. `"++Control"` -> `"Control++"`).
4. Sequence strokes are separated by single spaces, with surrounding and repeated whitespace collapsed.

