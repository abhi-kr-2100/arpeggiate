#!/usr/bin/env bun
/**
 * Arpeggiate CLI Demo: Conflict Detection & Key Normalization
 * Run with: `bun demos/node-conflicts/index.mjs` or `node demos/node-conflicts/index.mjs`
 */

import {
  detectConflicts,
  normalizeSequence,
  buildTrie,
  findTrieNode,
  collectContinuations,
} from "../../@arpeggiate/core/dist/index.mjs";

console.log("=== Arpeggiate Conflict Detection Matrix ===\n");

const keymapWithConflicts = {
  // 1. Direct Collision: Two equivalent combos mapping to different actions
  "j+k": "mode.visual",
  "k+j": "mode.escape",

  // 2. Prefix Shadowing: Single key 'g' shadows the longer sequence 'g g'
  "g": "doc.charJump",
  "g g": "doc.top",
  "g b": "doc.bottom",

  // 3. Combo Shadowing: Atomic single key 'j' pressed while waiting for combo 'j+k'
  "j": "doc.down",

  // 4. Reserved Browser Collision: System shortcut
  "Ctrl+w": "tab.close",
  "Alt+F4": "window.close",

  // Clean entry
  "Ctrl+k": "palette.open",
};

console.log("Analyzing bindings:");
for (const [seq, action] of Object.entries(keymapWithConflicts)) {
  console.log(`  "${seq}" => "${action}" (normalized: "${normalizeSequence(seq)}")`);
}

const conflicts = detectConflicts(keymapWithConflicts);

console.log(`\nFound ${conflicts.length} conflict(s):\n`);

for (let i = 0; i < conflicts.length; i += 1) {
  const c = conflicts[i];
  console.log(`[Conflict #${i + 1}] Type: ${c.type}`);
  switch (c.type) {
    case "direct_collision":
      console.log(`  Sequence: "${c.sequence}"`);
      console.log(`  Conflicting actions: ${c.actionIds.join(", ")}`);
      break;
    case "prefix_shadowing":
      console.log(`  Prefix sequence: "${c.prefixSequence}" (${c.prefixActionId})`);
      console.log(`  Unreachable longer sequence: "${c.longerSequence}" (${c.longerActionId})`);
      break;
    case "combo_shadowing":
      console.log(`  Single key: "${c.singleKeySequence}" (${c.singleActionId})`);
      console.log(`  Overlapping combo: "${c.comboSequence}" (${c.comboActionId})`);
      break;
    case "reserved_browser":
      console.log(`  OS/Browser Reserved Sequence: "${c.sequence}" (${c.actionId})`);
      break;
  }
  console.log("");
}

console.log("=== Prefix Trie DFA Demonstration ===\n");

const cleanKeymap = {
  "g g": "doc.top",
  "g b": "doc.bottom",
  "g v x": "doc.nestedVisual",
  "Space f": "find.files",
};

const trie = buildTrie(cleanKeymap);
console.log("Keymap registered in Radix Trie DFA:");
for (const [seq, action] of Object.entries(cleanKeymap)) {
  console.log(`  "${seq}" => "${action}"`);
}

console.log("\nLooking up partial stroke ['g']:");
const lookup = findTrieNode(trie, ["g"]);

if (lookup.found) {
  const continuations = collectContinuations(lookup.node, []);
  console.log(`Found ${continuations.length} WhichKey continuation(s):`);
  for (const item of continuations) {
    console.log(`  Next key: "${item.key}" | Action: "${item.actionId}" | Path: [${item.remainingSequence.join(", ")}]`);
  }
}
