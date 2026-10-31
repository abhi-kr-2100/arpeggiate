export {
  defineKeymap,
  type Key,
  type ParseStroke,
  type ParseKeySequence,
  type ValidatedKeymap,
  type Keymap,
  type ChordSignalFactory,
  type KeyboardConfig,
  type Keyboard,
  type KeyboardState,
  type ChordContinuation,
  type ConflictResult,
} from "./types.js";

export {
  normalizeEventKey,
  sortComboKeys,
  formatComboFromKeys,
  normalizeStroke,
  normalizeSequence,
} from "./normalizer.js";

export {
  createTrieNode,
  insertSequence,
  buildTrie,
  findTrieNode,
  collectContinuations,
  type MutableTrieNode,
  type TrieLookupResult,
} from "./trie.js";

export { detectConflicts } from "./conflicts.js";

export { createKeyboard } from "./engine.js";
