import { describe, expect, test } from "bun:test";
import {
  PrefixTrie,
  TrieNode,
  buildTrie,
  collectContinuations,
  findTrieNode,
  insertSequence,
} from "../src/trie.js";

describe("Prefix Trie DFA (Seam 2)", () => {
  test("instantiates PrefixTrie and TrieNode with OOP methods", () => {
    const trie = PrefixTrie.fromKeymap<string>({
      "g g": "doc.top",
      "g b": "doc.bottom",
      "Ctrl+k": "palette.open",
    });

    expect(trie).toBeInstanceOf(PrefixTrie);
    expect(trie.root).toBeInstanceOf(TrieNode);

    // Exact lookup using class method
    const match = trie.find(["g", "g"]);
    expect(match.found).toBe(true);
    if (match.found) {
      expect(match.node.isTerminal).toBe(true);
      expect(match.node.terminalActionId).toBe("doc.top");
    }

    // Direct continuations retrieval via trie method
    const continuations = trie.getContinuations(["g"]);
    expect(continuations).toEqual([
      { key: "g", actionId: "doc.top", remainingSequence: ["g"] },
      { key: "b", actionId: "doc.bottom", remainingSequence: ["b"] },
    ]);

    // getChild and getOrCreateChild on TrieNode
    const gChild = trie.root.getChild("g");
    expect(gChild).toBeDefined();
    expect(gChild?.getChild("b")?.terminalActionId).toBe("doc.bottom");

    // Dynamic insert via instance method
    trie.insert("g v", "doc.visual");
    const vMatch = trie.find(["g", "v"]);
    expect(vMatch.found).toBe(true);
    if (vMatch.found) {
      expect(vMatch.node.terminalActionId).toBe("doc.visual");
    }

    // Missing sequence continuations return empty array
    expect(trie.getContinuations(["nonexistent"])).toEqual([]);
  });
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

  test("enforces 100% compile-time type safety on sequences and keymap dictionaries", () => {
    const trie = new PrefixTrie();
    trie.insert("Ctrl+s", "doc.save");
    trie.insert("g g", "doc.top");

    // @ts-expect-error: typo "Ctl+s" rejected at compile time
    trie.insert("Ctl+s", "doc.invalid");

    // @ts-expect-error: combo with duplicate keys rejected at compile time
    trie.insert("j+j", "action.duplicate");

    // @ts-expect-error: empty sequence rejected at compile time
    trie.insert("", "action.empty");

    const root = trie.root;
    insertSequence(root, "Space f", "files.find");

    // @ts-expect-error: typo "Spce f" rejected at compile time
    insertSequence(root, "Spce f", "files.invalid");

    // @ts-expect-error: combo with duplicate keys in insertSequence rejected at compile time
    insertSequence(root, "Ctrl+Ctrl", "action.duplicateMod");

    // buildTrie rejects invalid key sequences in dictionary
    buildTrie({
      // @ts-expect-error: typo in keymap dictionary rejected at compile time
      "Ctl+s": "doc.save",
      // @ts-expect-error: duplicate keys in combo rejected at compile time
      "k+k": "action.dup",
    });

    // PrefixTrie.fromKeymap rejects invalid key sequences in dictionary
    PrefixTrie.fromKeymap({
      // @ts-expect-error: typo in keymap dictionary rejected at compile time
      "Ctrl+Shift+invalid": "action.invalid",
    });
  });
});
