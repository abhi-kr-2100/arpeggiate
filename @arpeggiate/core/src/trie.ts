import type { ChordContinuation, Keymap } from "./types.js";
import { normalizeSequence } from "./normalizer.js";

export interface MutableTrieNode<TActionId extends string> {
  terminalActionId: TActionId | "";
  isTerminal: boolean;
  readonly children: Map<string, MutableTrieNode<TActionId>>;
}

export function createTrieNode<TActionId extends string>(): MutableTrieNode<TActionId> {
  return {
    terminalActionId: "",
    isTerminal: false,
    children: new Map(),
  };
}

export function insertSequence<TActionId extends string>(
  root: MutableTrieNode<TActionId>,
  sequence: string,
  actionId: TActionId
): void {
  const normalized = normalizeSequence(sequence);
  const strokes = normalized.split(" ");
  let current = root;

  for (let index = 0; index < strokes.length; index += 1) {
    const stroke = strokes[index];
    if (typeof stroke === "string" && stroke.length > 0) {
      let nextNode = current.children.get(stroke);
      if (typeof nextNode === "undefined") {
        nextNode = createTrieNode<TActionId>();
        current.children.set(stroke, nextNode);
      }
      current = nextNode;
    }
  }

  current.terminalActionId = actionId;
  current.isTerminal = true;
}

export function buildTrie<TActionId extends string>(
  keymap: Keymap<TActionId>
): MutableTrieNode<TActionId> {
  const root = createTrieNode<TActionId>();
  const entries = Object.entries(keymap);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (typeof entry !== "undefined") {
      const [seq, actionId] = entry;
      insertSequence(root, seq, actionId);
    }
  }
  return root;
}

export type TrieLookupResult<TActionId extends string> =
  | { readonly found: true; readonly node: MutableTrieNode<TActionId> }
  | { readonly found: false };

export function findTrieNode<TActionId extends string>(
  root: MutableTrieNode<TActionId>,
  strokes: readonly string[]
): TrieLookupResult<TActionId> {
  let current = root;
  for (let index = 0; index < strokes.length; index += 1) {
    const stroke = strokes[index];
    if (typeof stroke === "string") {
      const nextNode = current.children.get(stroke);
      if (typeof nextNode === "undefined") {
        return { found: false };
      }
      current = nextNode;
    }
  }
  return { found: true, node: current };
}

export function collectContinuations<TActionId extends string>(
  node: MutableTrieNode<TActionId>,
  currentPath: readonly string[]
): ChordContinuation<TActionId>[] {
  const continuations: ChordContinuation<TActionId>[] = [];

  for (const [key, childNode] of node.children.entries()) {
    if (childNode.isTerminal && childNode.terminalActionId !== "") {
      continuations.push({
        key,
        actionId: childNode.terminalActionId,
        remainingSequence: [...currentPath, key],
      });
    }

    if (childNode.children.size > 0) {
      const subContinuations = collectContinuations(childNode, [...currentPath, key]);
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
