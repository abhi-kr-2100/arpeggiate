import { describe, expect, test } from "bun:test";
import {
  buildTrie,
  collectContinuations,
  findTrieNode,
  insertSequence,
} from "../src/trie.js";

describe("Prefix Trie DFA (Seam 2)", () => {
  test("inserts deep sequence and performs exact match lookup", () => {
    const root = buildTrie({
      "g g a": "doc.action",
      "j+k": "mode.visual",
    });

    const matchDeep = findTrieNode(root, ["g", "g", "a"]);
    expect(matchDeep.found).toBe(true);
    if (matchDeep.found) {
      expect(matchDeep.node.isTerminal).toBe(true);
      expect(matchDeep.node.terminalActionId).toBe("doc.action");
    }

    const matchCombo = findTrieNode(root, ["j+k"]);
    expect(matchCombo.found).toBe(true);
    if (matchCombo.found) {
      expect(matchCombo.node.isTerminal).toBe(true);
      expect(matchCombo.node.terminalActionId).toBe("mode.visual");
    }
  });

  test("handles partial prefix match, missing sequences, and terminal overwriting", () => {
    const root = buildTrie<string>({
      "g g": "doc.first",
      "g b": "doc.bottom",
    });

    // Partial prefix lookup
    const prefixMatch = findTrieNode(root, ["g"]);
    expect(prefixMatch.found).toBe(true);
    if (prefixMatch.found) {
      expect(prefixMatch.node.isTerminal).toBe(false);
      expect(prefixMatch.node.children.has("g")).toBe(true);
      expect(prefixMatch.node.children.has("b")).toBe(true);
    }

    // Missing sequence lookup
    const missing = findTrieNode(root, ["x"]);
    expect(missing.found).toBe(false);

    // Overwriting terminal action
    insertSequence(root, "g g", "doc.overwritten");
    const overwrittenMatch = findTrieNode(root, ["g", "g"]);
    expect(overwrittenMatch.found).toBe(true);
    if (overwrittenMatch.found) {
      expect(overwrittenMatch.node.terminalActionId).toBe("doc.overwritten");
    }
  });

  test("collects continuations from a trie node", () => {
    const root = buildTrie({
      "g g": "doc.top",
      "g b": "doc.bottom",
      "g v x": "doc.nested",
    });

    const prefixLookup = findTrieNode(root, ["g"]);
    expect(prefixLookup.found).toBe(true);
    if (prefixLookup.found) {
      const continuations = collectContinuations(prefixLookup.node, []);
      expect(continuations).toEqual([
        { key: "g", actionId: "doc.top", remainingSequence: ["g"] },
        { key: "b", actionId: "doc.bottom", remainingSequence: ["b"] },
        { key: "x", actionId: "doc.nested", remainingSequence: ["v", "x"] },
      ]);
    }
  });
});
