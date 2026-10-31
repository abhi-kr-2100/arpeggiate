import { describe, expect, test } from "bun:test";
import { PrefixTrie, TrieNode } from "../src/trie.js";

describe("TrieNode", () => {
  test("creates a node with optional actionId", () => {
    const emptyNode = new TrieNode();
    expect(emptyNode.actionId).toBeUndefined();
    expect(emptyNode.isTerminal).toBe(false);
    expect(emptyNode.hasChildren).toBe(false);
    expect(emptyNode.children.size).toBe(0);

    const actionNode = new TrieNode("nav.down");
    expect(actionNode.actionId).toBe("nav.down");
    expect(actionNode.isTerminal).toBe(true);
  });

  test("getChild retrieves child node or undefined", () => {
    const node = new TrieNode();
    expect(node.getChild("g")).toBeUndefined();

    const child = new TrieNode("doc.top");
    node.children.set("g", child);
    expect(node.getChild("g")).toBe(child);
  });

  test("getOrCreateChild returns existing or creates new child", () => {
    const node = new TrieNode();
    const created = node.getOrCreateChild("Control+k");
    expect(created).toBeInstanceOf(TrieNode);
    expect(node.children.get("Control+k")).toBe(created);
    expect(node.hasChildren).toBe(true);

    const retrieved = node.getOrCreateChild("Control+k");
    expect(retrieved).toBe(created);
  });

  test("findNode traverses down child hierarchy", () => {
    const root = new TrieNode();
    const g1 = root.getOrCreateChild("g");
    const g2 = g1.getOrCreateChild("g");
    g2.actionId = "doc.top";

    expect(root.findNode([])).toBe(root);
    expect(root.findNode(["g"])).toBe(g1);
    expect(root.findNode(["g", "g"])).toBe(g2);
    expect(root.findNode(["x"])).toBeUndefined();
    expect(root.findNode(["g", "x"])).toBeUndefined();
    expect(root.findNode(["g", "g", "g"])).toBeUndefined();
  });
});

describe("PrefixTrie", () => {
  test("creates an empty trie with no bindings", () => {
    const trie = new PrefixTrie();
    expect(trie.root).toBeInstanceOf(TrieNode);
    expect(trie.root.actionId).toBeUndefined();
    expect(trie.root.hasChildren).toBe(false);
  });

  test("registers single-stroke shortcut bindings via constructor", () => {
    const trie = new PrefixTrie({
      j: "nav.down",
      k: "nav.up",
    });

    const nodeJ = trie.root.getChild("j");
    expect(nodeJ?.actionId).toBe("nav.down");
    expect(nodeJ?.isTerminal).toBe(true);

    const nodeK = trie.root.getChild("k");
    expect(nodeK?.actionId).toBe("nav.up");
    expect(nodeK?.isTerminal).toBe(true);
  });

  test("registers multi-stroke sequence bindings via constructor", () => {
    const trie = new PrefixTrie({
      "g g": "doc.top",
    });

    const intermediate = trie.root.getChild("g");
    expect(intermediate).toBeDefined();
    expect(intermediate?.actionId).toBeUndefined();

    const terminal = intermediate?.getChild("g");
    expect(terminal).toBeDefined();
    expect(terminal?.actionId).toBe("doc.top");
  });

  test("inserts sequences dynamically and returns terminal node", () => {
    const trie = new PrefixTrie();
    const terminal = trie.insert("g g", "doc.top");

    expect(terminal).toBeInstanceOf(TrieNode);
    expect(terminal.actionId).toBe("doc.top");
    expect(terminal.isTerminal).toBe(true);

    const intermediate = trie.root.getChild("g");
    expect(intermediate).toBeDefined();
    expect(intermediate?.actionId).toBeUndefined();
    expect(intermediate?.getChild("g")).toBe(terminal);
  });

  test("shares intermediate nodes across multiple sequences", () => {
    const trie = new PrefixTrie({
      "g g": "doc.top",
      "g b": "doc.bottom",
      g: "doc.jump",
    });

    const intermediateG = trie.root.getChild("g");
    expect(intermediateG).toBeDefined();
    expect(intermediateG?.actionId).toBe("doc.jump");
    expect(intermediateG?.children.size).toBe(2);

    expect(intermediateG?.getChild("g")?.actionId).toBe("doc.top");
    expect(intermediateG?.getChild("b")?.actionId).toBe("doc.bottom");
  });

  test("normalizes sequence strings during insertion", () => {
    const trie = new PrefixTrie({
      "k+Control": "palette.open",
      "Control++": "view.zoomIn",
      "  g   g  ": "doc.top",
    });

    expect(trie.root.getChild("Control+k")?.actionId).toBe("palette.open");
    expect(trie.root.getChild("k+Control")).toBeUndefined();
    expect(trie.root.getChild("++Control")?.actionId).toBe("view.zoomIn");
    expect(trie.root.getChild("g")?.getChild("g")?.actionId).toBe("doc.top");
  });

  test("findNode returns root node when given empty strokes array", () => {
    const trie = new PrefixTrie({
      "g g": "doc.top",
    });

    const found = trie.findNode([]);
    expect(found).toBe(trie.root);
  });

  test("findNode finds intermediate node and terminal node", () => {
    const trie = new PrefixTrie({
      "g g": "doc.top",
      "Control+k": "palette.open",
    });

    const intermediate = trie.findNode(["g"]);
    expect(intermediate).toBeDefined();
    expect(intermediate?.actionId).toBeUndefined();
    expect(intermediate?.hasChildren).toBe(true);

    const sequenceTerminal = trie.findNode(["g", "g"]);
    expect(sequenceTerminal?.actionId).toBe("doc.top");

    const strokeTerminal = trie.findNode(["Control+k"]);
    expect(strokeTerminal?.actionId).toBe("palette.open");
  });

  test("findNode returns undefined for non-existent stroke or over-traversal", () => {
    const trie = new PrefixTrie({
      "g g": "doc.top",
    });

    expect(trie.findNode(["x"])).toBeUndefined();
    expect(trie.findNode(["g", "x"])).toBeUndefined();
    expect(trie.findNode(["g", "g", "g"])).toBeUndefined();
  });
});
