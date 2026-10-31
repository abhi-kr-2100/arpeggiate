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

---

## 2. Data Structures & State Machine

### Prefix Trie (`PrefixTrie`)
A deterministic tree retrieval data structure that models all registered shortcut sequences. Each edge represents a canonical stroke string, and every path from the root represents a sequence prefix. The trie provides deterministic $O(L)$ traversal and lookup, where $L$ is the number of strokes in the sequence.

### Trie Node (`TrieNode`)
An individual node in the prefix trie representing a state in the sequence progression.
- **Root Node**: The origin state representing an empty sequence buffer.
- **Intermediate Node**: A node with outgoing child edges (`hasChildren === true`), indicating an in-progress sequence awaiting further strokes.
- **Terminal Node**: A node carrying an assigned `actionId` (`isTerminal === true`), indicating the completion of a valid sequence. A node may be both intermediate and terminal if a shorter sequence forms a prefix of a longer sequence.

### Sequence Buffer (`buffer`)
An internal, in-memory array of canonical strokes entered so far in an ongoing sequence. The buffer persists across strokes while the user traverses intermediate trie nodes, and is reset when a terminal match occurs, an invalid stroke is received, or an explicit reset is triggered.

### Active Keys (`activeKeys`)
The internal tracking set of keys currently physically depressed on the keyboard, updated on `keydown` and removed on `keyup`.

### Current Stroke Keys (`currentStrokeKeys`)
The internal tracking set of all unique keys that have participated in the current simultaneous key stroke cycle. Flushed into a canonical stroke when all active keys are released or when a keydown creates an immediate terminal match.

---

## 3. Public API & Integration

### Keymap (`Keymap`)
An immutable key-value dictionary mapping shortcut sequence strings to action identifiers (`Readonly<Record<string, TActionId>>`).

### Validated Keymap (`ValidatedKeymap`)
A TypeScript mapped type that checks every key in a keymap at compile time using `ParseKeySequence`. Invalid strokes, malformed stroke syntax, or duplicate keys produce compile-time type errors containing descriptive error message literals.

### Action ID (`actionId`)
A unique, domain-specific string literal identifying the command, capability, or event triggered when a shortcut completes (e.g., `"palette.open"`, `"navigate.top"`, `"file.save"`).

### Controller (`KeyboardController`)
The teardown and lifecycle management object returned by `createKeyboard`. It is a callable cleanup function with attached helper properties:
- `()` / `destroy()`: Detaches all keyboard event listeners from the target element and clears state.
- `reset()`: Manually clears the sequence buffer and active key states without detaching listeners.
- `[Symbol.dispose]()`: Implements the explicit resource management contract (enabling the `using` keyword in TypeScript/JavaScript).

### Target (`EventTarget`)
The DOM element or window to which event listeners (`keydown`, `keyup`) are attached and within which the keyboard shortcuts are active.

### Config (`KeyboardConfig`)
The configuration object passed to `createKeyboard`, containing `bindings` (the keymap), `target` (the event target), and `onAction` (the invocation callback).
