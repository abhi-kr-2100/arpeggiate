import type { ChordContinuation, Keymap, ValidateKeySequence, ValidatedKeymap } from "./types.js";
import { normalizeSequence } from "./normalizer.js";

export class TrieNode<TActionId extends string = string> {
  public terminalActionId: TActionId | "" = "";
  public isTerminal = false;
  public readonly children: Map<string, TrieNode<TActionId>> = new Map();

  constructor(terminalActionId: TActionId | "" = "", isTerminal = false) {
    this.terminalActionId = terminalActionId;
    this.isTerminal = isTerminal;
  }

  public getChild(key: string): TrieNode<TActionId> | undefined {
    return this.children.get(key);
  }

  public getOrCreateChild(key: string): TrieNode<TActionId> {
    let child = this.children.get(key);
    if (!child) {
      child = new TrieNode<TActionId>();
      this.children.set(key, child);
    }
    return child;
  }

  public collectContinuations(currentPath: readonly string[] = []): ChordContinuation<TActionId>[] {
    const continuations: ChordContinuation<TActionId>[] = [];

    for (const [key, childNode] of this.children.entries()) {
      if (childNode.isTerminal && childNode.terminalActionId !== "") {
        continuations.push({
          key,
          actionId: childNode.terminalActionId,
          remainingSequence: [...currentPath, key],
        });
      }

      if (childNode.children.size > 0) {
        const subContinuations = childNode.collectContinuations([...currentPath, key]);
        for (let i = 0; i < subContinuations.length; i += 1) {
          const item = subContinuations[i];
          if (typeof item !== "undefined") {
            continuations.push(item);
          }
        }
      }
    }

    return continuations;
  }
}

export type MutableTrieNode<TActionId extends string = string> = TrieNode<TActionId>;

export type TrieLookupResult<TActionId extends string = string> =
  | { readonly found: true; readonly node: TrieNode<TActionId> }
  | { readonly found: false };

export class PrefixTrie<TActionId extends string = string> {
  public readonly root: TrieNode<TActionId>;

  constructor(root?: TrieNode<TActionId>) {
    this.root = root ?? new TrieNode<TActionId>();
  }

  public insert<TSeq extends string>(
    sequence: ValidateKeySequence<TSeq>,
    actionId: TActionId
  ): void {
    const normalized = normalizeSequence(sequence);
    const strokes = normalized.split(" ");
    let current = this.root;

    for (let index = 0; index < strokes.length; index += 1) {
      const stroke = strokes[index];
      if (typeof stroke === "string" && stroke.length > 0) {
        current = current.getOrCreateChild(stroke);
      }
    }

    current.terminalActionId = actionId;
    current.isTerminal = true;
  }

  public find(strokes: readonly string[]): TrieLookupResult<TActionId> {
    let current = this.root;
    for (let index = 0; index < strokes.length; index += 1) {
      const stroke = strokes[index];
      if (typeof stroke === "string") {
        const nextNode = current.getChild(stroke);
        if (typeof nextNode === "undefined") {
          return { found: false };
        }
        current = nextNode;
      }
    }
    return { found: true, node: current };
  }

  public getContinuations(strokes: readonly string[]): ChordContinuation<TActionId>[] {
    const lookup = this.find(strokes);
    if (!lookup.found) {
      return [];
    }
    return lookup.node.collectContinuations();
  }

  public static fromKeymap<
    TActionId extends string,
    const TKeymap extends Record<string, TActionId> = Keymap<TActionId>
  >(
    keymap: ValidatedKeymap<TKeymap>
  ): PrefixTrie<TActionId> {
    const trie = new PrefixTrie<TActionId>();
    const entries = Object.entries(keymap);
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      if (typeof entry !== "undefined") {
        const [seq, actionId] = entry;
        trie.insert(seq as any, actionId);
      }
    }
    return trie;
  }
}

export function createTrieNode<TActionId extends string = string>(): TrieNode<TActionId> {
  return new TrieNode<TActionId>();
}

export function insertSequence<TActionId extends string, TSeq extends string>(
  root: TrieNode<TActionId>,
  sequence: ValidateKeySequence<TSeq>,
  actionId: TActionId
): void {
  new PrefixTrie(root).insert(sequence, actionId);
}

export function buildTrie<
  TActionId extends string = string,
  const TKeymap extends Record<string, TActionId> = Keymap<TActionId>
>(
  keymap: ValidatedKeymap<TKeymap>
): TrieNode<TActionId> {
  return PrefixTrie.fromKeymap<TActionId, TKeymap>(keymap).root;
}

export function findTrieNode<TActionId extends string>(
  root: TrieNode<TActionId>,
  strokes: readonly string[]
): TrieLookupResult<TActionId> {
  return new PrefixTrie(root).find(strokes);
}

export function collectContinuations<TActionId extends string>(
  node: TrieNode<TActionId>,
  currentPath: readonly string[] = []
): ChordContinuation<TActionId>[] {
  return node.collectContinuations(currentPath);
}
