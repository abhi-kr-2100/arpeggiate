/**
 * Compile-time parser and validator for simultaneous key strokes (e.g. `"j+k"`, `"Control+a"`, `"Control++"`, `"+"`).
 *
 * @internal
 * @template S - The stroke string literal.
 * @template Seen - Internal accumulator tracking keys already encountered in the current stroke.
 */
export type ParseStroke<
  S extends string,
  Seen extends string = never
> = S extends "" | `${string} ${string}`
  ? never
  : S extends "+"
    ? S extends Seen ? never : S
    : S extends `${infer Head}+${infer Tail}`
      ? Head extends "" | Seen
        ? never
        : ParseStroke<Tail, Seen | Head> extends never ? never : S
      : S extends Seen
        ? never
        : S;

/**
 * Compile-time parser for whitespace-separated key sequences (e.g. `"Control Control"`, `"g g"`, `"j+k g g"`).
 *
 * Validates each individual stroke via {@link ParseStroke}. If any stroke is invalid or contains duplicate keys, evaluates to `never`.
 *
 * @internal
 * @template S - The whitespace-separated sequence string literal.
 */
export type ParseKeySequence<S extends string> =
  S extends `${infer Head} ${infer Rest}`
    ? ParseStroke<Head> extends never
      ? never
      : ParseKeySequence<Rest> extends never
        ? never
        : S
    : ParseStroke<S>;

/**
 * Mapped type that validates each sequence key in a keymap dictionary at compile time.
 *
 * If any key in the dictionary is not a valid sequence, its value type is replaced by an error message literal,
 * triggering a compile-time type error when defined.
 *
 * @template TKeymap - Dictionary object mapping key sequence strings to action identifiers.
 */
export type ValidatedKeymap<TKeymap extends Record<string, string>> = {
  [K in keyof TKeymap]: string extends K
    ? TKeymap[K]
    : ParseKeySequence<K & string> extends never
      ? `Error: Invalid key sequence '${K & string}'`
      : TKeymap[K];
};

/**
 * Immutable dictionary mapping shortcut sequences to action identifiers.
 *
 * @template TActionId - String union of action identifiers.
 */
export type Keymap<TActionId extends string = string> = Readonly<Record<string, TActionId>>;

/**
 * Teardown controller function that detaches keyboard event listeners from the target element.
 *
 * Can be invoked directly as a cleanup function or via its {@link KeyboardController.destroy} method.
 * Also supports manual state clearing via its {@link KeyboardController.reset} method,
 * as well as the explicit resource management `using` statement via `[Symbol.dispose]`.
 */
export interface KeyboardController {
  /**
   * Detaches all event listeners from the target element and cleans up internal state.
   */
  (): void;

  /**
   * Resets the active key states and sequence buffer.
   */
  readonly reset: () => void;

  /**
   * Detaches all event listeners from the target element and cleans up internal state.
   */
  readonly destroy: () => void;

  /**
   * Disposes of the keyboard listener, detaching all event listeners.
   */
  readonly [Symbol.dispose]: () => void;
}

/**
 * Configuration options for initializing an Arpeggiate keyboard shortcuts listener.
 *
 * @template TActionId - String union of action identifiers.
 * @template TKeymap - Record type mapping shortcut sequences to action identifiers.
 */
export interface KeyboardConfig<
  TActionId extends string = string,
  TKeymap extends Record<string, TActionId> = Keymap<TActionId>
> {
  /**
   * Validated keymap bindings mapping shortcut sequences to action identifiers.
   */
  readonly bindings: TKeymap;

  /**
   * The DOM event target or element inside which keyboard shortcuts are active.
   */
  readonly target: EventTarget;

  /**
   * Callback invoked whenever a bound shortcut sequence completes.
   *
   * @param actionId - The action identifier associated with the completed shortcut.
   * @param event - The triggering keyboard event.
   */
  readonly onAction: (actionId: TActionId, event: KeyboardEvent) => void;
}
