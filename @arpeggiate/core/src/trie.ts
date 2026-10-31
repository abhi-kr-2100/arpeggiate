import { normalizeSequence } from "./normalize.js";

/**
 * Node in the prefix trie representing a state in a key sequence.
 *
 * @internal
 * @template TActionId - String union of action identifiers.
 */
export class TrieNode<TActionId extends string = string> {
  /**
   * Action identifier associated with this terminal node, if any.
   */
  actionId?: TActionId | undefined;

  /**
   * Map of canonical stroke strings to child nodes representing continuations.
   */
  readonly children: Map<string, TrieNode<TActionId>> = new Map();

  /**
   * Creates a new prefix trie node.
   *
   * @param actionId - Optional action identifier associated with this node.
   */
  constructor(actionId?: TActionId) {
    if (actionId !== undefined) {
      this.actionId = actionId;
    }
  }

  /**
   * Retrieves the child node associated with the specified stroke.
   *
   * @param stroke - Canonical stroke string.
   * @returns The matching {@link TrieNode} or `undefined` if no child exists.
   */
  getChild(stroke: string): TrieNode<TActionId> | undefined {
    return this.children.get(stroke);
  }

  /**
   * Retrieves an existing child node or creates a new one if not present.
   *
   * @param stroke - Canonical stroke string.
   * @returns The existing or newly created {@link TrieNode}.
   */
  getOrCreateChild(stroke: string): TrieNode<TActionId> {
    let child = this.children.get(stroke);
    if (!child) {
      child = new TrieNode<TActionId>();
      this.children.set(stroke, child);
    }
    return child;
  }

  /**
   * Traverses the trie along a given sequence of strokes starting from this node.
   *
   * @param strokes - Array of canonical stroke strings representing the traversal path.
   * @returns The matching {@link TrieNode} or `undefined` if no matching path exists.
   */
  findNode(strokes: readonly string[]): TrieNode<TActionId> | undefined {
    let current: TrieNode<TActionId> | undefined = this;
    for (const stroke of strokes) {
      if (!current) return undefined;
      current = current.getChild(stroke);
    }
    return current;
  }

  /**
   * Indicates whether this node has any outgoing child continuations.
   */
  get hasChildren(): boolean {
    return this.children.size > 0;
  }

  /**
   * Indicates whether this node is a terminal node with an associated action identifier.
   */
  get isTerminal(): boolean {
    return this.actionId !== undefined;
  }
}

/**
 * Prefix trie data structure for key sequence matching and buffer traversal.
 *
 * Encapsulates the root node and sequence insertion/lookup operations.
 *
 * @internal
 * @template TActionId - String union of action identifiers.
 */
export class PrefixTrie<TActionId extends string = string> {
  /**
   * The root node of the prefix trie.
   */
  readonly root: TrieNode<TActionId>;

  /**
   * Creates a new prefix trie, optionally populated with key sequence bindings.
   *
   * @param bindings - Optional mapping of sequence strings to action identifiers.
   */
  constructor(bindings?: Readonly<Record<string, TActionId>>) {
    this.root = new TrieNode<TActionId>();
    if (bindings) {
      this.insertAll(bindings);
    }
  }

  /**
   * Inserts a sequence binding into the trie.
   *
   * @param sequence - Shortcut sequence string (e.g. "Control+k" or "g g").
   * @param actionId - Action identifier to trigger when the sequence completes.
   * @returns The terminal {@link TrieNode} representing the completed sequence.
   */
  insert(sequence: string, actionId: TActionId): TrieNode<TActionId> {
    const strokes = normalizeSequence(sequence).split(" ");
    let current = this.root;
    for (const stroke of strokes) {
      current = current.getOrCreateChild(stroke);
    }
    current.actionId = actionId;
    return current;
  }

  /**
   * Inserts multiple sequence bindings into the trie.
   *
   * @param bindings - Mapping of sequence strings to action identifiers.
   */
  insertAll(bindings: Readonly<Record<string, TActionId>>): void {
    for (const [seq, actionId] of Object.entries(bindings)) {
      this.insert(seq, actionId);
    }
  }

  /**
   * Traverses the trie along a given sequence of strokes.
   *
   * @param strokes - Array of canonical stroke strings representing the traversal path.
   * @returns The matching {@link TrieNode} or `undefined` if no matching path exists.
   */
  findNode(strokes: readonly string[]): TrieNode<TActionId> | undefined {
    return this.root.findNode(strokes);
  }
}
