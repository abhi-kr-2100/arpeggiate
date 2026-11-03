// 1. Universal Peer Token
export type Key =
  | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
  | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  | "Ctrl" | "Shift" | "Alt" | "Meta" | "Mod"
  | "Escape" | "Enter" | "Tab" | "Space" | "Backspace" | "Delete"
  | "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
  | "Home" | "End" | "PageUp" | "PageDown"
  | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8" | "F9" | "F10" | "F11" | "F12"
  | "," | "." | "/" | ";" | "'" | "[" | "]" | "\\" | "-" | "=" | "`";

// 2. Recursive Simultaneous Combo Parser (e.g. "j+k", "Ctrl+a", "Shift+s")
export type ParseStroke<S extends string> =
  S extends `${infer Head}+${infer Tail}`
    ? Head extends Key
      ? ParseStroke<Tail> extends never ? never : S
      : never
    : S extends Key ? S : never;

// 3. Recursive Sequential Sequence Parser (e.g. "Ctrl Ctrl", "g g", "j+k g g")
export type ParseKeySequence<S extends string> =
  S extends `${infer Head} ${infer Rest}`
    ? ParseStroke<Head> extends never
      ? never
      : ParseKeySequence<Rest> extends never ? never : S
    : ParseStroke<S> extends never ? never : S;

// 4. Validated Keymap Mapped Type
export type ValidatedKeymap<TKeymap extends Record<string, string>> = {
  [K in keyof TKeymap]: ParseKeySequence<Extract<K, string>> extends never
    ? `Error: Invalid key sequence '${Extract<K, string>}'`
    : TKeymap[K];
};

// 5. Zero-Cost Compile-Time Keymap Identity Helper
export function defineKeymap<const TKeymap extends Record<string, string>>(
  keymap: ValidatedKeymap<TKeymap>
): TKeymap {
  return keymap as TKeymap;
}

// Pure Keymap Dictionary
export type Keymap<TActionId extends string = string> = Readonly<Record<string, TActionId>>;

// Chord Signal Factory (supports custom AbortSignal timeouts)
export type ChordSignalFactory = (chord: readonly string[]) => AbortSignal;

// Configuration Options
export interface KeyboardConfig<TActionId extends string = string> {
  readonly bindings: Keymap<TActionId>;
  readonly onAction: (actionId: TActionId, event: KeyboardEvent) => void;
  readonly target: EventTarget;
  readonly getChordSignal?: ChordSignalFactory | undefined;
}

// Controller Interface
export interface Keyboard<TActionId extends string = string> {
  readonly set: (bindings: Keymap<TActionId>) => void;
  readonly reset: (reason: string) => void;
  readonly subscribe: (listener: (state: KeyboardState<TActionId>) => void) => () => void;
  readonly getState: () => KeyboardState<TActionId>;
  readonly destroy: () => void;
}

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

// Conflict Resolution Discriminated Union
export type ConflictResult<TActionId extends string = string> =
  | {
      readonly type: "direct_collision";
      readonly sequence: string;
      readonly actionIds: readonly [TActionId, TActionId, ...TActionId[]];
    }
  | {
      readonly type: "prefix_shadowing";
      readonly prefixSequence: string;
      readonly prefixActionId: TActionId;
      readonly longerSequence: string;
      readonly longerActionId: TActionId;
    }
  | {
      readonly type: "combo_shadowing";
      readonly singleKeySequence: string;
      readonly singleActionId: TActionId;
      readonly comboSequence: string;
      readonly comboActionId: TActionId;
    }
  | {
      readonly type: "reserved_browser";
      readonly sequence: string;
      readonly actionId: TActionId;
    };
