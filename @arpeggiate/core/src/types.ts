/**
 * Canonical array of all individual keyboard key tokens.
 */
export const ALL_KEYS = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "Ctrl", "Shift", "Alt", "Meta", "Mod",
  "Escape", "Enter", "Tab", "Space", "Backspace", "Delete",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "Home", "End", "PageUp", "PageDown",
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
  ",", ".", "/", ";", "'", "[", "]", "\\", "-", "=", "`", "+",
] as const;

/**
 * Universal Peer Token representing canonical individual keyboard keys.
 */
export type Key = (typeof ALL_KEYS)[number];

const KEY_SET = new Set<string>(ALL_KEYS);

/**
 * Runtime type guard verifying whether a string is a canonical Key token.
 */
export function isKey(value: string): value is Key {
  return KEY_SET.has(value);
}

/**
 * Compile-time validator for individual key tokens.
 */
export type ValidateKey<K extends string> = K extends Key ? K : `Error: Invalid key '${K}'`;

export type ValidatedKey<K extends string> = ValidateKey<K>;

// 2. Recursive Simultaneous Combo Parser (e.g. "j+k", "Ctrl+a", "Ctrl++", "+")
export type ParseStroke<S extends string, Seen extends Key = never> =
  S extends "+"
    ? "+" extends Seen
      ? never
      : S
    : S extends `${infer Prefix}++`
      ? "+" extends Seen
        ? never
        : ParseStroke<Prefix, Seen | "+"> extends never
          ? never
          : S
      : S extends `${infer Head}+${infer Tail}`
        ? Head extends Key
          ? Head extends Seen
            ? never
            : ParseStroke<Tail, Seen | Head> extends never
              ? never
              : S
          : never
        : S extends Key
          ? S extends Seen
            ? never
            : S
          : never;

// 3. Recursive Sequential Sequence Parser (e.g. "Ctrl Ctrl", "g g", "j+k g g")
export type ParseKeySequence<S extends string> =
  S extends `${infer Head} ${infer Rest}`
    ? ParseStroke<Head> extends never
      ? never
      : ParseKeySequence<Rest> extends never ? never : S
    : ParseStroke<S> extends never ? never : S;

// 4. Compile-Time Key Sequence Validator
export type ValidateKeySequence<S extends string> = ParseKeySequence<S> extends never
  ? `Error: Invalid key sequence '${S}'`
  : S;

export type ValidatedKeySequence<S extends string> = ValidateKeySequence<S>;

// 5. Validated Keymap Mapped Type
export type ValidatedKeymap<TKeymap extends Record<string, string>> = {
  [K in keyof TKeymap]: string extends K
    ? TKeymap[K]
    : ParseKeySequence<Extract<K, string>> extends never
      ? `Error: Invalid key sequence '${Extract<K, string>}'`
      : TKeymap[K];
};

// 6. Zero-Cost Compile-Time Keymap Identity Helper
export function defineKeymap<const TKeymap extends Record<string, string>>(
  keymap: ValidatedKeymap<TKeymap>
): TKeymap {
  return keymap as TKeymap;
}

// Pure Keymap Dictionary
export type Keymap<TActionId extends string = string> = Readonly<Record<string, TActionId>>;

// Chord Signal Factory (supports custom AbortSignal timeouts)
export type ChordSignalFactory = (chord: readonly string[]) => AbortSignal;

// Abstract Event Source Interface
export interface KeyboardEventSource {
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
}

// Configuration Options
export interface KeyboardConfig<
  TActionId extends string = string,
  TKeymap extends Record<string, TActionId> = Keymap<TActionId>
> {
  readonly bindings: ValidatedKeymap<TKeymap>;
  readonly onAction: (actionId: TActionId, event: KeyboardEvent) => void;
  readonly target: EventTarget | KeyboardEventSource;
  readonly getChordSignal?: ChordSignalFactory;
}

// Controller Interface
export interface KeyboardController<TActionId extends string = string> {
  readonly set: <const TNewKeymap extends Record<string, TActionId> = Keymap<TActionId>>(
    bindings: ValidatedKeymap<TNewKeymap>
  ) => void;
  readonly reset: (reason: string) => void;
  readonly subscribe: (listener: (state: KeyboardState<TActionId>) => void) => () => void;
  readonly getState: () => KeyboardState<TActionId>;
  readonly destroy: () => void;
}

export type Keyboard<TActionId extends string = string> = KeyboardController<TActionId>;

// Discriminated State Snapshot (Strict Zero-Null / Zero-Undefined)
export type KeyboardState<TActionId extends string = string> =
  | {
      readonly isBuffering: false;
      readonly buffer: readonly [];
      readonly continuations: readonly [];
    }
  | {
      readonly isBuffering: true;
      readonly buffer: readonly string[];
      readonly continuations: readonly ChordContinuation<TActionId>[];
    };

export interface ChordContinuation<TActionId extends string = string> {
  readonly key: string;
  readonly actionId: TActionId;
  readonly remainingSequence: readonly string[];
}

