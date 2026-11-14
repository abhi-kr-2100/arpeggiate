# Arpeggiate Specification

## 1. Mathematical Model

Arpeggiate models keyboard shortcut processing as a deterministic transition system mapping OS keyboard events and Sequence State to actions.

### 1.1 Grammar

- **Key ($\mathcal{K}$)**: Non-empty set of distinct key identifiers. All keys are symmetric; modifiers have no special status.
- **Stroke ($\mathcal{S}$)**: Non-empty, finite set of concurrent keys:
  $$s \in \mathcal{S} = \mathcal{P}(\mathcal{K}) \setminus \{ \emptyset \}$$
  Key order is invariant: $\{ \text{Control}, \text{s} \} = \{ \text{s}, \text{Control} \}$.
- **Sequence ($\mathcal{S}^+$)**: Non-empty, finite ordered tuple of strokes:
  $$\sigma = (s_1, \dots, s_n) \in \mathcal{S}^+, \quad n \ge 1$$

### 1.2 Shortcut Map

Given Action IDs $\mathcal{A}$, a Shortcut Map is a partial function:
$$M: \mathcal{S}^+ \to \mathcal{A}$$

- **Valid Sequence Prefixes**:
  $$Q = \{ \sigma \in \mathcal{S}^+ \mid \exists \sigma' \in \operatorname{dom}(M) \text{ such that } \sigma \sqsubseteq \sigma' \} \cup \{ \varepsilon \}$$
- **Next Strokes**: For $q \in Q$, $\operatorname{Next}(q) = \{ s \in \mathcal{S} \mid q \cdot s \in Q \}$.
- **Key Prefixes**: For $S \subseteq \mathcal{S}$, $\operatorname{Prefix}(S) = \{ K \subseteq \mathcal{K} \mid \exists s \in S \text{ such that } K \subseteq s \}$.

### 1.3 State Transitions

Engine state is $\omega = (q, H) \in Q \times \mathcal{P}(\mathcal{K})$, where $q$ is Sequence State (initially $\varepsilon$) and $H$ is Held Keys (initially $\emptyset$).

On event $e \in \{ (\downarrow, k), (\uparrow, k) \}$, the Engine transitions $(q, H) \xrightarrow{e} (q', H')$ and emits an optional Action ID $a \in \mathcal{A} \cup \{ \emptyset \}$:

1. **Keydown ($e = (\downarrow, k)$)**:
   - Update Held Keys: $H' = H \cup \{ k \}$
   - Resolve context:
     $$q_{\text{eff}} = \begin{cases}
     q & \text{if } H' \in \operatorname{Prefix}(\operatorname{Next}(q)) \\
     \varepsilon & \text{otherwise}
     \end{cases}$$
   - Evaluate stroke and action:
     - **Complete Stroke ($H' \in \operatorname{Next}(q_{\text{eff}})$)**:
       Let $q^* = q_{\text{eff}} \cdot H'$.
       If $q^* \in \operatorname{dom}(M)$, emit $a = M(q^*)$ and reset $q' = \varepsilon$.
       Otherwise, emit $a = \emptyset$ and advance $q' = q^*$.
     - **Incomplete Stroke ($H' \in \operatorname{Prefix}(\operatorname{Next}(q_{\text{eff}}))$)**:
       Emit $a = \emptyset$ and hold $q' = q_{\text{eff}}$.
     - **Invalid ($H' \notin \operatorname{Prefix}(\operatorname{Next}(q_{\text{eff}}))$)**:
       Emit $a = \emptyset$ and reset $q' = \varepsilon$.

2. **Keyup ($e = (\uparrow, k)$)**:
   - Update Held Keys: $H' = H \setminus \{ k \}$
   - Maintain Sequence State: $q' = q$
   - Emit $a = \emptyset$.

### 1.4 Conflicting Actions

If $\sigma_1, \sigma_2 \in \operatorname{dom}(M)$ such that $\sigma_1 \sqsubset \sigma_2$, completing $\sigma_1$ matches immediately and resets $q' = \varepsilon$. Shorter sequences always preempt longer extensions (e.g. `"g"` preempts `"g g"`).

---

## 2. Requirements

### 2.1 Grammar Syntax

- **Key**: String identifier (e.g. `"a"`, `"Enter"`, `"Escape"`, `"Control"`).
- **Stroke**: Keys joined with `+` (e.g. `"Control+s"`, `"j+k"`). Order-invariant; supports $N \ge 1$ concurrent keys.
- **Sequence**: Strokes separated by whitespace (e.g. `"g g"`, `"Control+k Control+s"`).
- Invalid syntax must be rejected with an error.

### 2.2 Shortcut Map Configuration

- The Engine accepts a Shortcut Map associating Sequences with Action IDs.
- Within a single Scope, each Sequence maps to at most one Action ID; duplicate definitions overwrite the prior mapping.
- Shorter prefixes preempt longer sequences (Conflicting Actions).

### 2.3 Scope Isolation

- The Engine requires an explicitly specified Scope (DOM Element); no default is permitted.
- Only keyboard events occurring within or bubbling through the Scope are processed.
- The Engine does not automatically track focus loss; client code is responsible for triggering State Reset on blur or cancellation.

### 2.4 Event Filtering

- The Engine accepts an optional Event Filter predicate.
- Rejected events are ignored without modifying $H$ or $q$.

### 2.5 Sequence Progression & Invalid Key Recovery

- Inputs continuing ongoing Sequence State advance $q$ or trigger the Action Handler if complete.
- Inputs invalid for the ongoing Sequence State reset $q$ to root ($\varepsilon$) and evaluate from root:
  - If the input completes a Sequence in the Shortcut Map from root, the Action Handler is notified and $q' = \varepsilon$.
  - If the input matches a sequence prefix in the Shortcut Map from root, $q'$ advances to that prefix.
  - If the input matches no Sequence or sequence prefix from root, $q' = \varepsilon$.

### 2.6 Action Handler & Lifecycle

- The Engine notifies the Action Handler callback whenever an Action ID is invoked.
- A reset method must perform State Reset, clearing $(q, H) \to (\varepsilon, \emptyset)$.
- A teardown method must unbind all event listeners and release resources.
