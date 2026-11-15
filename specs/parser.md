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

- **Sequence Delimiter**: One or more whitespace characters separating strokes.
- **Stroke Delimiter**: `+` joining keys within a stroke.
- **Delimiter Collision Handling**:
  - The key `"+"` is written as isolated `"+"` or trailing `++` in strokes (e.g. `"Control++"` $\mapsto \{ \text{Control}, \text{+} \}$). Non-terminal `++` (e.g. `"Control++s"`) is invalid.
  - The spacebar key is written as `"Space"` to avoid collision with whitespace delimiters.

Malformed syntax maps to $\bot$.

---

## 2. Requirements

### 2.1 Grammar & Syntax

- Keys are exact identifiers; no aliases or synonym substitutions are permitted. Casing is strictly preserved.
- Consecutive strokes are separated by whitespace; concurrent keys in a stroke are separated by `+`.
- Delimiter-colliding keys:
  - `"+"` is parsed as `{ "+" }` when isolated, and as the key `"+"` when terminating a stroke with `++` (e.g. `"Control++"` $\to \{ \text{"Control"}, \text{"+"} \}$).
  - `"Space"` is parsed as the spacebar key identifier.
- Invalid syntax (empty strings, dangling or non-terminal adjacent delimiters like `"+s"`, `"Control+"`, `"Control++s"`) must be rejected with an error ($\bot$).

### 2.2 Compile-Time Parsing

- String literals must be validated and parsed at compile time via the type system, producing strongly typed Sequences with zero runtime parsing overhead.
- Syntactically invalid literals must produce compile-time type errors.
- Must parse the following literals at compile time:
  1. `"Control+s"` $\to$ `[{"Control", "s"}]`
  2. `"j"` $\to$ `[{"j"}]`
  3. `"g g"` $\to$ `[{"g"}, {"g"}]`
  4. `"Control+Shift+p"` $\to$ `[{"Control", "Shift", "p"}]`
  5. `"AudioVolumeUp10"` $\to$ `[{"AudioVolumeUp10"}]`
  6. `"Control++"` $\to$ `[{"Control", "+"}]`
  7. `"Control+Space"` $\to$ `[{"Control", "Space"}]`
  8. `"+"` $\to$ `[{"+"}]`
  9. `"Space"` $\to$ `[{"Space"}]`

### 2.3 Runtime Parsing

- Dynamic values not known at compile time must be parsed at runtime with identical validation and semantics.
- Execution must be linear $O(L)$ relative to string length $L$, allocation-minimal, and free of regex backtracking.
- Syntactically invalid dynamic strings must throw an error.
