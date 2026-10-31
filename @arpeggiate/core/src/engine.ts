import {
  buildTrie,
  findTrieNode,
  collectContinuations,
  type MutableTrieNode,
} from "./trie.js";
import { formatComboFromKeys, normalizeEventKey } from "./normalizer.js";
import type {
  Keyboard,
  KeyboardConfig,
  KeyboardState,
  Keymap,
} from "./types.js";

export function createKeyboard<TActionId extends string = string>(
  config: KeyboardConfig<TActionId>
): Keyboard<TActionId> {
  let activeKeymap: Keymap<TActionId> = config.bindings;
  let rootNode: MutableTrieNode<TActionId> = buildTrie(activeKeymap);

  let sequenceBuffer: string[] = [];
  const activeKeys = new Set<string>();
  const currentStrokeKeys = new Set<string>();
  const listeners = new Set<(state: KeyboardState<TActionId>) => void>();

  let abortController = new AbortController();

  function buildStateSnapshot(): KeyboardState<TActionId> {
    if (sequenceBuffer.length === 0) {
      return {
        isBuffering: false,
        buffer: [],
        continuations: [],
      };
    }

    const lookup = findTrieNode(rootNode, sequenceBuffer);
    if (!lookup.found) {
      return {
        isBuffering: false,
        buffer: [],
        continuations: [],
      };
    }

    const continuations = collectContinuations(lookup.node, []);
    return {
      isBuffering: true,
      buffer: [...sequenceBuffer],
      continuations,
    };
  }

  function notifySubscribers(): void {
    const snapshot = buildStateSnapshot();
    for (const listener of listeners) {
      listener(snapshot);
    }
  }

  function resetBuffer(reason: string): void {
    if (!abortController.signal.aborted) {
      abortController.abort(reason);
    }
    abortController = new AbortController();
    sequenceBuffer = [];
    currentStrokeKeys.clear();
    notifySubscribers();
  }

  function handleKeyDown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    // Drop IME composition events
    if (event.isComposing || event.key === "Process") {
      return;
    }

    const key = normalizeEventKey(event.key);

    // Escape cancels pending sequence buffer
    if (sequenceBuffer.length > 0 && key === "Escape") {
      event.preventDefault();
      resetBuffer("Escape");
      return;
    }

    activeKeys.add(key);
    currentStrokeKeys.add(key);

    const stroke = formatComboFromKeys(currentStrokeKeys);

    // Continuous key repeat streaming bypasses buffering for single terminal keys
    if (event.repeat && sequenceBuffer.length === 0) {
      const directLookup = rootNode.children.get(stroke);
      if (typeof directLookup !== "undefined" && directLookup.isTerminal && directLookup.terminalActionId !== "") {
        event.preventDefault();
        config.onAction(directLookup.terminalActionId, event);
        return;
      }
    }

    const candidateStrokes = [...sequenceBuffer, stroke];
    const lookup = findTrieNode(rootNode, candidateStrokes);

    // Terminal match check on keydown (immediate activation for simultaneous chords)
    if (lookup.found && lookup.node.isTerminal && lookup.node.terminalActionId !== "") {
      event.preventDefault();
      const actionId = lookup.node.terminalActionId;
      resetBuffer("Executed");
      config.onAction(actionId, event);
    }
  }

  function handleKeyUp(event: Event): void {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    const key = normalizeEventKey(event.key);
    activeKeys.delete(key);

    // When all concurrent keys are released, commit stroke to sequence buffer
    if (activeKeys.size === 0 && currentStrokeKeys.size > 0) {
      const stroke = formatComboFromKeys(currentStrokeKeys);
      currentStrokeKeys.clear();

      const candidateStrokes = [...sequenceBuffer, stroke];
      const lookup = findTrieNode(rootNode, candidateStrokes);

      if (lookup.found) {
        if (lookup.node.isTerminal && lookup.node.terminalActionId !== "") {
          const actionId = lookup.node.terminalActionId;
          resetBuffer("Executed");
          config.onAction(actionId, event);
        } else if (lookup.node.children.size > 0) {
          sequenceBuffer = candidateStrokes;
          notifySubscribers();

          if (typeof config.getChordSignal === "function") {
            const signal = config.getChordSignal(sequenceBuffer);
            signal.addEventListener(
              "abort",
              () => {
                resetBuffer("ChordSignalAbort");
              },
              { once: true }
            );
          }
        } else {
          resetBuffer("DeadEnd");
        }
      } else {
        resetBuffer("InvalidSequence");
      }
    }
  }

  function handleBlur(): void {
    activeKeys.clear();
    currentStrokeKeys.clear();
    resetBuffer("TargetBlur");
  }

  config.target.addEventListener("keydown", handleKeyDown);
  config.target.addEventListener("keyup", handleKeyUp);
  config.target.addEventListener("blur", handleBlur);

  return {
    set(newBindings: Keymap<TActionId>): void {
      activeKeymap = newBindings;
      rootNode = buildTrie(activeKeymap);
      resetBuffer("KeymapChanged");
    },
    reset(reason: string): void {
      resetBuffer(reason);
    },
    subscribe(listener: (state: KeyboardState<TActionId>) => void): () => void {
      listeners.add(listener);
      listener(buildStateSnapshot());
      return () => {
        listeners.delete(listener);
      };
    },
    getState(): KeyboardState<TActionId> {
      return buildStateSnapshot();
    },
    destroy(): void {
      config.target.removeEventListener("keydown", handleKeyDown);
      config.target.removeEventListener("keyup", handleKeyUp);
      config.target.removeEventListener("blur", handleBlur);
      listeners.clear();
      activeKeys.clear();
      currentStrokeKeys.clear();
      sequenceBuffer = [];
    },
  };
}
