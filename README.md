# Arpeggiate

> **A sub-1kB, headless keyboard shortcuts engine with a Symmetrical Key Model, Radix Prefix Trie DFA, zero modifier privilege, continuous repeat streaming, and headless React 19 bindings.**

[![License](https://img.shields.io/badge/license-CC--BY--NC--ND--4.0-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun%20%7C%20Node%20%7C%20Browser-black.svg)](https://bun.sh)
[![Coverage](https://img.shields.io/badge/coverage-99.19%25-brightgreen.svg)]()
[![Zero Mocks](https://img.shields.io/badge/tests-zero--mocks-success.svg)]()

---

## Table of Contents

- [Overview](#overview)
- [Core Problems Solved](#core-problems-solved)
- [Architectural Invariants](#architectural-invariants)
- [Packages](#packages)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [1. Vanilla TypeScript / JavaScript (`@arpeggiate/core`)](#1-vanilla-typescript--javascript-arpeggiatecore)
  - [2. Modern React 19 (`@arpeggiate/react`)](#2-modern-react-19-arpeggiatereact)
  - [3. Browser `<script>` Tag (CDN)](#3-browser-script-tag-cdn)
- [Symmetrical Grammar & Syntax](#symmetrical-grammar--syntax)
- [Continuous Repeat Streaming](#continuous-repeat-streaming)
- [Pure Conflict Detection Matrix](#pure-conflict-detection-matrix)
- [Building a Headless WhichKey HUD](#building-a-headless-whichkey-hud)
- [Target Environments](#target-environments)
- [Interactive Demos](#interactive-demos)
- [Development & Verification](#development--verification)
- [License](#license)

---

## Overview

**Arpeggiate** is a zero-dependency, headless keyboard engine built from mathematical first principles. It resolves simultaneous chords (`j+k`, `Ctrl+a`) and sequential chords (`Ctrl Ctrl`, `g g`, `Space f`) into string action identifiers using an in-memory **Radix Prefix Trie Deterministic Finite Automaton (DFA)** in $< 0.05\text{ms}$.

Traditional keyboard libraries treat modifier keys as second-class boolean bitmasks, swallow continuous key repeat events, or bundle modal HUDs and CSS stylesheets that clash with your design system. Arpeggiate solves this by treating every physical key as an equal peer token.

---

## Core Problems Solved

| Problem | Traditional Libraries (Mousetrap, Hotkeys-js) | Arpeggiate Solution |
| :--- | :--- | :--- |
| **Modifier Inequality** | Modifiers are boolean flags (`ctrlKey`, `shiftKey`). Normal key combos (`j+k`) or double modifiers (`Ctrl Ctrl`) are impossible or fragile. | **Zero Modifier Privilege:** Every key is a first-class peer token (`Key`). Symmetrical chords (`j+k`, `Ctrl+a`) and sequential chords (`Ctrl Ctrl`, `g g`) work identically. |
| **Sluggish Key Repeat** | Buffering architectures swallow or delay native `event.repeat` events, crippling fluid document navigation. | **Continuous Repeat Streaming:** Terminal single keys bypass sequence buffering on `event.repeat === true` and fire immediately at display refresh rate (60fps/120fps). |
| **Type-Level Union Overflow** | String typing allows runtime typos (`"ctrl+bogus"`), while full unions trigger TypeScript `TS2590: Expression produces a union type that is too complex`. | **Recursive Type Parsers:** Validates sequence grammar at compile time via recursive template literals of arbitrary length without union overflow. |
| **UI & CSS Coupling** | Bundles modal HUDs, key badges, or intrusive CSS files that conflict with StyleX, Tailwind, or Vanilla CSS. | **100% Headless Architecture:** Zero CSS, zero DOM elements bundled. Pure controller state and reactive hooks. |
| **Runtime Exceptions** | Unchecked `null`, `undefined`, and fallback operators (`??`, `||`) mask underlying state bugs. | **Strict Zero-Null / Zero-Undefined:** All state lookups use discriminated tagged unions. |

---

## Architectural Invariants

Every module in Arpeggiate strictly conforms to these design invariants:

- **Zero Modifier Privilege:** Modifiers (`Ctrl`, `Shift`, `Alt`, `Meta`, `Mod`) are treated identically to character keys (`j`, `k`, `Space`).
- **Strict Separation of Concerns:** The engine maps key sequences exclusively to **Action ID strings** (e.g. `"doc.top"`). Human titles, icons, and command dispatch are pure user-space concerns.
- **Continuous Repeat Streaming:** Single navigation keys fire at 60fps/120fps with zero buffering overhead on `event.repeat === true`.
- **Radix Prefix Trie DFA:** Keystroke lookup executes in $O(L)$ time ($L \le 4$, $< 0.05\text{ms}$).
- **Deterministic Key Normalization:** Chords are normalized deterministically: `Mod` $\to$ `Ctrl` $\to$ `Alt` $\to$ `Shift` $\to$ `Meta` $\to$ alphabetical (`k+j` $\equiv$ `j+k`).
- **Zero Null / Zero Undefined:** Zero `null` returns, zero `undefined` returns, zero `??` operators, and zero `||` fallback operators.

---

## Packages

```
arpeggiate/
├── @arpeggiate/core      # Sub-1kB headless keyboard shortcuts engine & DFA trie
└── @arpeggiate/react     # Headless React 19 context provider and hooks
```

---

## Installation

### Core Package

```bash
# Bun
bun add @arpeggiate/core

# npm
npm install @arpeggiate/core

# pnpm
pnpm add @arpeggiate/core
```

### React Package

```bash
# Bun
bun add @arpeggiate/core @arpeggiate/react

# npm
npm install @arpeggiate/core @arpeggiate/react
```

---

## Quick Start

### 1. Vanilla TypeScript / JavaScript (`@arpeggiate/core`)

```typescript
import { createKeyboard, defineKeymap } from "@arpeggiate/core";

// Define a type-safe keymap with compile-time sequence validation
const bindings = defineKeymap({
  // Single navigation keys (supports continuous repeat)
  j: "reader.scrollDown",
  k: "reader.scrollUp",

  // Symmetrical simultaneous combo (ordinary keys held together)
  "j+k": "reader.visualMode",

  // Sequential chords
  "g g": "reader.scrollTop",
  "g b": "reader.scrollBottom",

  // Double modifier chord
  "Ctrl Ctrl": "palette.open",

  // Leader sequence
  "Space f": "files.find",
});

// Create headless keyboard engine
const keyboard = createKeyboard({
  bindings,
  target: window,
  onAction: (actionId, event) => {
    console.log(`Action triggered: ${actionId}`);

    if (actionId === "reader.scrollDown") {
      window.scrollBy({ top: 50 });
    }
  },
});

// Subscribe to WhichKey state transitions
keyboard.subscribe((state) => {
  if (state.isBuffering) {
    console.log("Current sequence prefix:", state.buffer.join(" "));
    console.log("Available continuations:", state.continuations);
  }
});
```

### 2. Modern React 19 (`@arpeggiate/react`)

```tsx
import { useState } from "react";
import { ShortcutsProvider, useKeyboard, useWhichKey } from "@arpeggiate/react";
import { defineKeymap } from "@arpeggiate/core";

const bindings = defineKeymap({
  "j": "doc.scrollDown",
  "k": "doc.scrollUp",
  "j+k": "mode.visual",
  "g g": "doc.jumpTop",
  "Ctrl Ctrl": "search.open",
});

// 1. Headless WhichKey HUD Component (styled in your own design system)
function WhichKeyHud() {
  const { isBuffering, buffer, continuations } = useWhichKey();

  if (!isBuffering) return null;

  return (
    <aside className="which-key-hud">
      <div className="hud-prefix">Prefix: {buffer.join(" ")}</div>
      <ul>
        {continuations.map((item) => (
          <li key={item.key}>
            <kbd>{item.key}</kbd> <span>{item.actionId}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// 2. Main Consumer Component
function Reader() {
  const keyboard = useKeyboard();

  return (
    <div>
      <h1>Document Reader</h1>
      <button onClick={() => keyboard.reset("UserCancelled")}>Reset</button>
    </div>
  );
}

// 3. Application Root
export function App() {
  return (
    <ShortcutsProvider
      bindings={bindings}
      onAction={(actionId, event) => {
        console.log("Dispatched:", actionId);
      }}
    >
      <Reader />
      <WhichKeyHud />
    </ShortcutsProvider>
  );
}
```

### 3. Browser `<script>` Tag (CDN)

For vanilla HTML pages or legacy applications without bundlers:

```html
<!-- Load Arpeggiate Core -->
<script src="https://unpkg.com/@arpeggiate/core"></script>
<script>
  const { createKeyboard, defineKeymap } = window.ArpeggiateCore;

  const keyboard = createKeyboard({
    bindings: defineKeymap({
      "j+k": "mode.visual",
      "g g": "doc.top",
    }),
    target: window,
    onAction: (actionId) => alert(actionId),
  });
</script>
```

---

## Symmetrical Grammar & Syntax

The engine operates on a formal symmetrical grammar with two operators:

1. **`+` (Simultaneous Combo):** Keys held down concurrently at the same moment in time.
2. **` ` (Space, Sequential Chord):** Strokes pressed and released sequentially across time.

```
"j+k"           -> Press 'j' and 'k' simultaneously
"Ctrl+a"        -> Press 'Ctrl' and 'a' simultaneously
"g g"           -> Press 'g', release, then press 'g'
"Ctrl Ctrl"     -> Press 'Ctrl', release, then press 'Ctrl'
"Space f"       -> Press 'Space', release, then press 'f'
"j+k g g"       -> Simultaneous combo 'j+k', release, followed by 'g' then 'g'
```

### Deterministic Combo Ordering
Keys in a combo are canonicalized deterministically regardless of switch actuation order:
$$\text{Mod} \longrightarrow \text{Ctrl} \longrightarrow \text{Alt} \longrightarrow \text{Shift} \longrightarrow \text{Meta} \longrightarrow \text{Alphabetical}$$

- `k+j` $\equiv$ `j+k`
- `a+Ctrl` $\equiv$ `Ctrl+a`
- `Shift+k+j` $\equiv$ `Shift+j+k`

---

## Continuous Repeat Streaming

Holding down navigation keys (such as <kbd>j</kbd> for document scroll down, <kbd>k</kbd>, or <kbd>ArrowDown</kbd>) generates browser `keydown` events with `event.repeat === true`.

Traditional libraries buffer repeated keys or queue debounce timers, causing visible stutter. Arpeggiate detects terminal single keys on repeat:
1. Verifies `sequenceBuffer.length === 0`.
2. Verifies direct match in `rootNode.children`.
3. Calls `onAction(actionId, event)` immediately and invokes `event.preventDefault()`.

No buffer allocations, no timers, and no HUD subscriber notifications occur during repeat streaming, guaranteeing 60fps/120fps display refresh-rate responsiveness.

---

## Pure Conflict Detection Matrix

Before activating a keymap, validate it with `detectConflicts(bindings)` to catch collisions and shadowing:

```typescript
import { detectConflicts } from "@arpeggiate/core";

const conflicts = detectConflicts({
  "j": "doc.scrollDown",
  "j+k": "mode.visual",     // Conflict: combo_shadowing
  "g": "doc.jump",
  "g g": "doc.top",          // Conflict: prefix_shadowing
  "Ctrl+w": "tab.close",     // Conflict: reserved_browser
});

console.log(conflicts);
```

### The 4 Conflict Classes

| Conflict Class | Description | Example |
| :--- | :--- | :--- |
| **`direct_collision`** | Two equivalent normalized sequences bound to distinct Action IDs. | `'j+k'` $\to$ `'mode.visual'` AND `'k+j'` $\to$ `'mode.escape'` |
| **`prefix_shadowing`** | Sequence A is a strict sequential prefix of Sequence B. B is unreachable because A fires first. | `'g'` $\to$ `'doc.top'` AND `'g g'` $\to$ `'doc.bottom'` |
| **`combo_shadowing`** | Atomic single key overlaps with a simultaneous combo in the same map. Single key may fire prematurely. | `'j'` $\to$ `'doc.down'` AND `'j+k'` $\to$ `'mode.visual'` |
| **`reserved_browser`** | Binding conflicts with critical OS/browser shortcuts. | `'Ctrl+w'`, `'Ctrl+t'`, `'Alt+F4'` |

---

## Building a Headless WhichKey HUD

When a user initiates a sequential chord (e.g. presses <kbd>g</kbd> or <kbd>Space</kbd>), the engine enters buffering state and computes all available continuations using the Trie DFA.

```typescript
type KeyboardState<TActionId> =
  | {
      readonly isBuffering: false;
      readonly buffer: readonly [];
      readonly continuations: readonly [];
    }
  | {
      readonly isBuffering: true;
      readonly buffer: readonly string[];
      readonly continuations: readonly ChordContinuation<TActionId>[];
    };
```

Because Arpeggiate is 100% headless, you can render your HUD using any styling solution (StyleX, Tailwind, Vanilla CSS):

```tsx
const { isBuffering, buffer, continuations } = useWhichKey();

if (!isBuffering) return null;

return (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900 border border-neutral-700 p-4 rounded-lg shadow-xl">
    <div className="text-xs text-neutral-400 mb-2">PREFIX: {buffer.join(" ")}</div>
    <div className="flex flex-col gap-1">
      {continuations.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <kbd className="bg-neutral-800 text-sky-400 px-2 py-0.5 rounded text-sm">{item.key}</kbd>
          <span className="text-sm text-neutral-200">{item.actionId}</span>
        </div>
      ))}
    </div>
  </div>
);
```

---

## Target Environments

Every build includes full TypeScript definitions, dual module formats, and standalone browser bundles:

| Target | File | Usage |
| :--- | :--- | :--- |
| **Browser `<script>` tag** | `dist/index.global.js` | `<script src="index.global.js"></script>` $\to$ `window.ArpeggiateCore` |
| **Node.js (CommonJS)** | `dist/index.cjs` | `const { createKeyboard } = require("@arpeggiate/core")` |
| **Node.js / Bun (ESM)** | `dist/index.mjs` | `import { createKeyboard } from "@arpeggiate/core"` |
| **TypeScript (Backend/Web)** | `dist/*.d.ts` | Complete type definitions with zero `any` |

---

## Interactive Demos

Explore working examples in the [`demos/`](file:///home/abhi/Projects/arpeggiate/demos) directory:

1. **[Vanilla HTML Demo](demos/vanilla-html/index.html)**: Interactive document scroll demo with continuous repeat streaming, `j+k` visual mode toggle, and live WhichKey HUD overlay using `dist/index.global.js`.
2. **[React 19 Demo](demos/react-demo/index.html)**: Headless React 19 integration showcasing `<ShortcutsProvider>`, `useKeyboard`, and custom `useWhichKey` HUD.
3. **[Node.js / Bun CLI Demo](demos/node-conflicts/index.mjs)**: Command-line matrix demonstrating `detectConflicts`, `normalizeSequence`, and prefix trie continuation resolution. Run with:
   ```bash
   bun demos/node-conflicts/index.mjs
   ```

---

## Development & Verification

Built with **Bun** and **TypeScript 7**. Tests run with **100% real DOM instances** (zero mock libraries):

```bash
# Install dependencies
bun install

# Run build pipeline (ESM, CJS, Global IIFE, Types)
bun run build

# Run TypeScript typechecks
bun run typecheck

# Run test suite with coverage
bun test --coverage
```

### Test Suite Highlights
- **34 tests** across 10 files with **99.19% total code coverage**.
- Zero test mocks (`jest.fn()`, `sinon` prohibited): executes against real `EventTarget` and `KeyboardEvent` instances via Happy DOM.

---

## License

This project is licensed under the [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License (CC-BY-NC-ND-4.0)](LICENSE).
