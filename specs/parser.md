# Parser Specification

## 1. Mathematical Model

The Parser transforms a Sequence String into a Sequence:
$$\operatorname{Parse}: \Sigma^* \to \mathcal{S}^+ \cup \{ \bot \}$$

### 1.1 Grammar

- **Key ($\mathcal{K}$)**: Non-empty identifiers not containing whitespace. Includes `"+"` and `"Space"`.
- **Stroke ($\mathcal{S}$)**: Non-empty, finite set of concurrent keys:
  $$s \in \mathcal{S} = \mathcal{P}(\mathcal{K}) \setminus \{ \emptyset \}$$
  Key order is invariant: $\{ \text{Control}, \text{s} \} = \{ \text{s}, \text{Control} \}$. Duplicate keys collapse: $\{ k, k \} = \{ k \}$.
- **Sequence ($\mathcal{S}^+$)**: Non-empty, finite ordered tuple of strokes:
  $$\sigma = (s_1, \dots, s_n) \in \mathcal{S}^+, \quad n \ge 1$$
  Stroke order is strictly preserved: $(s_1, s_2) \ne (s_2, s_1)$ when $s_1 \ne s_2$.

### 1.2 Syntax & Delimiters

- **Sequence Delimiter**: One or more whitespace characters separating consecutive strokes within a Sequence.
- **Stroke Delimiter**: `+` joining keys within a stroke.
- **Delimiter Collision Handling**:
  - The key `"+"` is written as isolated `"+"` or trailing `++` in strokes (e.g. `"Control++"` $\mapsto \{ \text{Control}, \text{+} \}$). Non-terminal `++` (e.g. `"Control++s"`) is invalid.
  - The spacebar key is written as `"Space"` to avoid collision with whitespace delimiters.

Malformed syntax maps to $\bot$.

---

## 2. Requirements

### 2.1 Grammar & Syntax

- Keys are exact identifiers; no aliases or synonym substitutions are permitted. Casing is strictly preserved.
- Consecutive strokes are separated by one or more whitespace characters; concurrent keys in a stroke are separated by `+`. Leading and trailing whitespace is permitted and ignored.
- Delimiter-colliding keys:
  - `"+"` is parsed as `{ "+" }` when isolated, and as the key `"+"` when terminating a stroke with `++` (e.g. `"Control++"` $\to \{ \text{"Control"}, \text{"+"} \}$).
  - `"Space"` is parsed as the spacebar key identifier.
- Invalid syntax (empty strings, sequences containing only whitespace, dangling or non-terminal adjacent delimiters like `"+s"`, `"Control+"`, `"Control++s"`) must be rejected with an error ($\bot$).

### 2.2 Runtime Parsing

- The Parser must validate a Sequence String and transform it into a Sequence during program execution.
- Execution must be linear $O(L)$ relative to string length $L$, allocation-minimal, and free of regex backtracking.
- Syntactically invalid strings must throw an error.

### 2.3 Browser & Environment Support

- Direct browser usage via a `<script>` tag is supported by a standalone minified bundle exposing `window.arpeggiate`.
- Module usage is supported via an ES module bundle and Node16/NodeNext-compatible type declarations.
