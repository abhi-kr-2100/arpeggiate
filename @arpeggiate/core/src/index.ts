export {
  defineKeymap,
  ALL_KEYS,
  isKey,
  type Key,
  type ValidateKey,
  type ValidatedKey,
  type ParseStroke,
  type ParseKeySequence,
  type ValidateKeySequence,
  type ValidatedKeySequence,
  type ValidatedKeymap,
  type Keymap,
  type ChordSignalFactory,
  type KeyboardConfig,
  type KeyboardController,
  type KeyboardEventSource,
  type KeyboardState,
  type ChordContinuation,
} from "./types.js";

export {
  KeyStroke,
  KeySequence,
  normalizeEventKey,
  sortComboKeys,
  formatComboFromKeys,
  normalizeStroke,
  normalizeSequence,
} from "./normalizer.js";

export {
  TrieNode,
  PrefixTrie,
  createTrieNode,
  insertSequence,
  buildTrie,
  findTrieNode,
  collectContinuations,
  type MutableTrieNode,
  type TrieLookupResult,
} from "./trie.js";

export { KeymapBuilder } from "./builder.js";

export { Keyboard, createKeyboard, SequenceBuffer, StrokeTracker, type StrokeResult } from "./engine.js";
