import { normalizeKey, sortStroke } from "./normalize.js";
import { PrefixTrie } from "./trie.js";
import type { KeyboardConfig, KeyboardController, Keymap, ValidatedKeymap } from "./types.js";

/**
 * Creates and attaches a keyboard shortcut listener to the specified element.
 *
 * @template TActionId - String union of action identifiers.
 * @template TKeymap - Keymap dictionary type.
 * @param config - Configuration options including keymap bindings, target element, and action callback.
 * @returns A {@link KeyboardController} teardown function that detaches all event listeners when called.
 *
 * @example
 * ```ts
 * const cleanup = createKeyboard({
 *   target: window,
 *   bindings: {
 *     "Control+k": "palette.open",
 *     "g g": "navigate.top",
 *   },
 *   onAction: (actionId) => {
 *     console.log("Action triggered:", actionId);
 *   },
 * });
 *
 * // Detach listeners
 * cleanup();
 * ```
 */
export function createKeyboard<
  TActionId extends string = string,
  const TKeymap extends Record<string, TActionId> = Keymap<TActionId>
>(
  config: KeyboardConfig<TActionId, TKeymap> & {
    readonly bindings: ValidatedKeymap<TKeymap>;
  }
): KeyboardController {
  const trie = new PrefixTrie<TActionId>(config.bindings);
  const activeKeys = new Set<string>();
  const currentStrokeKeys = new Set<string>();
  let buffer: string[] = [];

  function reset(): void {
    buffer = [];
    activeKeys.clear();
    currentStrokeKeys.clear();
  }

  function onKeyDown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.isComposing || event.key === "Process") return;

    const key = normalizeKey(event.key);

    activeKeys.add(key);
    currentStrokeKeys.add(key);
    const stroke = sortStroke(currentStrokeKeys);

    // Immediate terminal match on keydown
    const candidateStrokes = [...buffer, stroke];
    const match = trie.findNode(candidateStrokes);
    if (match?.actionId) {
      event.preventDefault();
      reset();
      config.onAction(match.actionId, event);
    }
  }

  function onKeyUp(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;
    const key = normalizeKey(event.key);

    activeKeys.delete(key);
    if (activeKeys.size === 0 && currentStrokeKeys.size > 0) {
      const stroke = sortStroke(currentStrokeKeys);
      currentStrokeKeys.clear();

      const candidateStrokes = [...buffer, stroke];
      const match = trie.findNode(candidateStrokes);
      if (match?.actionId) {
        reset();
        config.onAction(match.actionId, event);
      } else if (match && match.hasChildren) {
        buffer = candidateStrokes;
      } else {
        reset();
      }
    }
  }

  config.target.addEventListener("keydown", onKeyDown);
  config.target.addEventListener("keyup", onKeyUp);

  const cleanup = () => {
    config.target.removeEventListener("keydown", onKeyDown);
    config.target.removeEventListener("keyup", onKeyUp);
    reset();
  };

  const controller: KeyboardController = Object.assign(cleanup, {
    reset,
    destroy: cleanup,
    [Symbol.dispose]: cleanup,
  });

  return controller;
}
