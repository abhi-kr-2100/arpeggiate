# Arpeggiate Specification

## 1. Mathematical Model

Arpeggiate formalizes keyboard shortcut processing as a deterministic transition system mapping OS keyboard events to strokes, and sequences of strokes to Action IDs.

### 1.1 Grammar

1. **Key ($\mathcal{K}$)**: The non-empty set of distinct key identifiers. All keys are symmetric; modifier keys possess no special status.
2. **Stroke ($\mathcal{S}$)**: A non-empty, finite subset of keys pressed simultaneously:
   $$s \in \mathcal{S} = \mathcal{P}(\mathcal{K}) \setminus \{ \emptyset \}$$
   Because a Stroke is mathematically a set:
   - Key order is invariant: $\{ \text{Control}, \text{Shift}, \text{p} \} = \{ \text{Shift}, \text{Control}, \text{p} \}$.
   - Chords may contain any finite number of keys $N \ge 1$ (e.g. single keys, 2-key chords, 3+ key chords).
3. **Sequence ($\mathcal{S}^+$)**: A non-empty, finite ordered tuple of strokes:
   $$\sigma = (s_1, s_2, \dots, s_n) \in \mathcal{S}^+, \quad n \ge 1$$
   - Single-Stroke Sequence: $|\sigma| = 1$.
   - Multi-Stroke Sequence: $|\sigma| > 1$.

### 1.2 Shortcut Map

Given a set of Action IDs $\mathcal{A}$, a Shortcut Map is a partial function:
$$M: \mathcal{S}^+ \to \mathcal{A}$$

The language of recognized sequences is $\operatorname{dom}(M)$, and the set of valid sequence prefixes is:
$$Q = \{ \sigma \in \mathcal{S}^+ \mid \exists \sigma' \in \operatorname{dom}(M) \text{ such that } \sigma \sqsubseteq \sigma' \} \cup \{ \varepsilon \}$$

For any state $q \in Q$, the set of valid next strokes is:
$$\operatorname{Next}(q) = \{ s \in \mathcal{S} \mid q \cdot s \in Q \}$$

### 1.3 Event-to-Stroke Mapping

Let $\mathcal{E}$ be the stream of OS keyboard events:
$$\mathcal{E} = \{ (\text{type}, k, \text{repeat}) \mid \text{type} \in \{ \downarrow, \uparrow \}, k \in \mathcal{K}, \text{repeat} \in \{ 0, 1 \} \}$$
where $\downarrow$ denotes keydown, $\uparrow$ denotes keyup, and $\text{repeat} = 1$ denotes an OS auto-repeat event.

The Engine maintains an input state $(H, C)$:
- **Held Keys ($H \subseteq \mathcal{K}$)**: Keys currently depressed. Initially $H_0 = \emptyset$.
- **Active Chord ($C \subseteq \mathcal{K}$)**: The cumulative set of keys depressed during the ongoing stroke gesture. Initially $C_0 = \emptyset$.

Upon receiving event $e \in \mathcal{E}$ while in sequence state $q \in Q$, the Engine emits an optional Stroke $s \in \mathcal{S} \cup \{ \emptyset \}$ and updates state $(H, C) \to (H', C')$:

1. **Keydown ($e = (\downarrow, k, 0)$)**:
   A key $k$ is pressed down.
   - **Update**:
     $$H' = H \cup \{ k \}, \quad C' = C \cup \{ k \}$$
   - **Stroke Emission**:
     - If $C' \in \operatorname{Next}(q)$:
       Stroke $s = C'$ is emitted.
     - Otherwise:
       $s = \emptyset$ (deferred; chord is still accumulating keys toward a target stroke).
   *(Examples:*
   *- For `Control+Shift+P`: pressing `Control` gives $C=\{\text{Control}\}$, pressing `Shift` gives $C=\{\text{Control}, \text{Shift}\}$, and pressing `P` gives $C=\{\text{Control}, \text{Shift}, \text{P}\} \in \operatorname{Next}(\varepsilon)$, emitting exactly the 3-key stroke without intermediate emissions.*
   *- For `Control+K Control+S`: pressing `Control` then `K` gives $C=\{\text{Control}, \text{K}\} \in \operatorname{Next}(\varepsilon)$, emitting stroke $s_1$. Releasing `K` leaves $H=\{\text{Control}\}$, resetting $C=\{\text{Control}\}$. Pressing `S` gives $C=\{\text{Control}, \text{S}\} \in \operatorname{Next}(s_1)$, emitting stroke $s_2$.)*

2. **Auto-Repeat ($e = (\downarrow, k, 1)$)**:
   The OS repeats an already-held key $k \in H$.
   - **Update**: $H' = H, \quad C' = C$.
   - **Stroke Emission**:
     - If $H \in \operatorname{Next}(q)$: $s = H$.
     - Otherwise: $s = \emptyset$.
   *(Holding on a key, such as `j`, repeatedly emits stroke $\{ j \}$ on each OS repeat event).*

3. **Keyup ($e = (\uparrow, k, \cdot)$)**:
   Key $k$ is released.
   - **Update**:
     $$H' = H \setminus \{ k \}, \quad C' = \begin{cases}
     H' & \text{if } H' \neq \emptyset \\
     \emptyset & \text{if } H' = \emptyset
     \end{cases}$$
   - **Stroke Emission**: $s = \emptyset$.

### 1.4 Sequence Matching State Machine

The Engine tracks recognized sequence prefixes using state $q \in Q$ (initially $q_0 = \varepsilon$).

When a non-empty Stroke $s \in \mathcal{S}$ is emitted:
$$\delta(q, s) = \begin{cases}
q \cdot s & \text{if } q \cdot s \in Q \\
s & \text{if } q \cdot s \notin Q \text{ and } s \in Q \\
\varepsilon & \text{otherwise}
\end{cases}$$

- If $\delta(q, s) \in \operatorname{dom}(M)$:
  The Action Handler is invoked with Action ID $M(\delta(q, s))$, and state resets to $\varepsilon$.
- Otherwise:
  State transitions to $\delta(q, s)$.

---

## 2. Requirements

### 2.1 Grammar Syntax

- **Key**: Represented by a string identifier (e.g. `"a"`, `"Enter"`, `"Escape"`, `"Control"`).
- **Stroke**: Keys combined with `+` (e.g. `"Control+s"`, `"Control+Shift+p"`, `"j+k"`, `"j+k+l"`). Order-invariant; supports any number of concurrent keys $N \ge 1$.
- **Sequence**: Strokes separated by whitespace (e.g. `"g g"`, `"Control+k Control+s"`, `"j+k j+s"`).
- Invalid syntax must be rejected with an error.

### 2.2 Shortcut Map Configuration

- The Engine must accept a Shortcut Map associating Sequences to Action IDs.
- Within a single Scope, each Sequence maps to at most one Action ID.
- Defining a duplicate Sequence within the same Scope overwrites the previous mapping.

### 2.3 Scope Isolation

- The Engine requires an explicitly specified Scope (DOM Element). No default is permitted.
- Only keyboard events occurring within or bubbling through the specified Scope are processed.

### 2.4 Event Filtering

- The Engine accepts an optional Event Filter.
- No default event filtering is performed. All events within the Scope are processed unless rejected by the provided Event Filter.
- When the Event Filter rejects an event, the Engine ignores it without modifying $H$, $C$, or $q$.

### 2.5 Action Handler & Execution

- The Engine must accept an Action Handler callback.
- The Engine is strictly responsible for notifying the Action Handler when an Action ID is invoked.
- The Engine must provide a teardown method to unbind all event listeners and release resources.
