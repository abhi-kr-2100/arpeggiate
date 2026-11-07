import {
  PrefixTrie,
} from "./trie.js";
import { formatComboFromKeys, normalizeEventKey } from "./normalizer.js";
import { isKey } from "./types.js";
import type {
  Key,
  KeyboardConfig,
  KeyboardController,
  KeyboardState,
  Keymap,
  ValidatedKeymap,
} from "./types.js";

export interface StrokeResult {
  readonly isCompleted: boolean;
  readonly stroke: string;
}

export class StrokeTracker<TKey extends Key = Key> {
  private readonly activeKeys = new Set<TKey>();
  private readonly currentStrokeKeys = new Set<TKey>();

  public get isHoldingKeys(): boolean {
    return this.activeKeys.size > 0;
  }

  public keyDown(key: TKey): string {
    this.activeKeys.add(key);
    this.currentStrokeKeys.add(key);
    return formatComboFromKeys(this.currentStrokeKeys);
  }

  public keyUp(key: TKey): StrokeResult {
    this.activeKeys.delete(key);
    if (this.activeKeys.size === 0 && this.currentStrokeKeys.size > 0) {
      const stroke = formatComboFromKeys(this.currentStrokeKeys);
      this.currentStrokeKeys.clear();
      return { isCompleted: true, stroke };
    }
    return { isCompleted: false, stroke: "" };
  }

  public reset(): void {
    this.activeKeys.clear();
    this.currentStrokeKeys.clear();
  }
}

export class SequenceBuffer {
  private buffer: string[] = [];
  private abortController = new AbortController();

  public get strokes(): readonly string[] {
    return this.buffer;
  }

  public get isBuffering(): boolean {
    return this.buffer.length > 0;
  }

  public get length(): number {
    return this.buffer.length;
  }

  public set(strokes: readonly string[]): void {
    this.buffer = [...strokes];
  }

  public reset(reason: string): void {
    if (!this.abortController.signal.aborted) {
      this.abortController.abort(reason);
    }
    this.abortController = new AbortController();
    this.buffer = [];
  }

  public bindSignal(signal: AbortSignal, onAbort: () => void): void {
    signal.addEventListener("abort", onAbort, { once: true });
  }

  public clear(): void {
    this.buffer = [];
  }
}

export class Keyboard<
  TActionId extends string = string,
  const TKeymap extends Record<string, TActionId> = Keymap<TActionId>
> implements KeyboardController<TActionId> {
  private readonly config: KeyboardConfig<TActionId, TKeymap>;
  private activeKeymap: Keymap<TActionId>;
  private trie: PrefixTrie<TActionId>;

  private readonly sequenceBuffer = new SequenceBuffer();
  private readonly strokeTracker = new StrokeTracker();
  private readonly listeners = new Set<(state: KeyboardState<TActionId>) => void>();

  constructor(config: KeyboardConfig<TActionId, TKeymap>) {
    this.config = config;
    this.activeKeymap = config.bindings as Keymap<TActionId>;
    this.trie = PrefixTrie.fromKeymap(this.activeKeymap);

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleBlur = this.handleBlur.bind(this);

    this.set = this.set.bind(this);
    this.reset = this.reset.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.getState = this.getState.bind(this);
    this.destroy = this.destroy.bind(this);

    this.config.target.addEventListener("keydown", this.handleKeyDown);
    this.config.target.addEventListener("keyup", this.handleKeyUp);
    this.config.target.addEventListener("blur", this.handleBlur);
  }

  public get state(): KeyboardState<TActionId> {
    return this.buildStateSnapshot();
  }

  public getState(): KeyboardState<TActionId> {
    return this.buildStateSnapshot();
  }

  public set<const TNewKeymap extends Record<string, TActionId> = Keymap<TActionId>>(
    newBindings: ValidatedKeymap<TNewKeymap>
  ): void {
    this.activeKeymap = newBindings as Keymap<TActionId>;
    this.trie = PrefixTrie.fromKeymap(this.activeKeymap);
    this.resetBuffer("KeymapChanged");
  }

  public reset(reason: string): void {
    this.resetBuffer(reason);
  }

  public subscribe(listener: (state: KeyboardState<TActionId>) => void): () => void {
    this.listeners.add(listener);
    listener(this.buildStateSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public destroy(): void {
    this.config.target.removeEventListener("keydown", this.handleKeyDown);
    this.config.target.removeEventListener("keyup", this.handleKeyUp);
    this.config.target.removeEventListener("blur", this.handleBlur);
    this.listeners.clear();
    this.strokeTracker.reset();
    this.sequenceBuffer.clear();
  }

  public handleKeyDown(event: Event): void {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    // Drop IME composition events
    if (event.isComposing || event.key === "Process") {
      return;
    }

    const rawKey = normalizeEventKey(event.key);

    // Escape cancels pending sequence buffer
    if (this.sequenceBuffer.isBuffering && rawKey === "Escape") {
      event.preventDefault();
      this.resetBuffer("Escape");
      return;
    }

    if (!isKey(rawKey)) {
      if (this.sequenceBuffer.isBuffering) {
        this.resetBuffer("InvalidSequence");
      }
      return;
    }

    const key = rawKey;
    const stroke = this.strokeTracker.keyDown(key);

    // Continuous key repeat streaming bypasses buffering for single terminal keys
    if (event.repeat && !this.sequenceBuffer.isBuffering) {
      const directLookup = this.trie.root.getChild(stroke);
      if (typeof directLookup !== "undefined" && directLookup.isTerminal && directLookup.terminalActionId !== "") {
        event.preventDefault();
        this.config.onAction(directLookup.terminalActionId, event);
        return;
      }
    }

    const candidateStrokes = [...this.sequenceBuffer.strokes, stroke];
    const lookup = this.trie.find(candidateStrokes);

    // Terminal match check on keydown (immediate activation for simultaneous chords)
    if (lookup.found && lookup.node.isTerminal && lookup.node.terminalActionId !== "") {
      event.preventDefault();
      const actionId = lookup.node.terminalActionId;
      this.resetBuffer("Executed");
      this.config.onAction(actionId, event);
    }
  }

  public handleKeyUp(event: Event): void {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    const rawKey = normalizeEventKey(event.key);
    if (!isKey(rawKey)) {
      return;
    }

    const key = rawKey;
    const { isCompleted, stroke } = this.strokeTracker.keyUp(key);

    // When all concurrent keys are released, commit stroke to sequence buffer
    if (isCompleted) {
      const candidateStrokes = [...this.sequenceBuffer.strokes, stroke];
      const lookup = this.trie.find(candidateStrokes);

      if (lookup.found) {
        if (lookup.node.isTerminal && lookup.node.terminalActionId !== "") {
          const actionId = lookup.node.terminalActionId;
          this.resetBuffer("Executed");
          this.config.onAction(actionId, event);
        } else if (lookup.node.children.size > 0) {
          this.sequenceBuffer.set(candidateStrokes);
          this.notifySubscribers();

          if (typeof this.config.getChordSignal === "function") {
            const signal = this.config.getChordSignal(this.sequenceBuffer.strokes);
            this.sequenceBuffer.bindSignal(signal, () => {
              this.resetBuffer("ChordSignalAbort");
            });
          }
        } else {
          this.resetBuffer("DeadEnd");
        }
      } else {
        this.resetBuffer("InvalidSequence");
      }
    }
  }

  public handleBlur(): void {
    this.strokeTracker.reset();
    this.resetBuffer("TargetBlur");
  }

  private buildStateSnapshot(): KeyboardState<TActionId> {
    if (!this.sequenceBuffer.isBuffering) {
      return {
        isBuffering: false,
        buffer: [],
        continuations: [],
      };
    }

    const lookup = this.trie.find(this.sequenceBuffer.strokes);
    if (!lookup.found) {
      return {
        isBuffering: false,
        buffer: [],
        continuations: [],
      };
    }

    const continuations = lookup.node.collectContinuations();
    return {
      isBuffering: true,
      buffer: [...this.sequenceBuffer.strokes],
      continuations,
    };
  }

  private notifySubscribers(): void {
    const snapshot = this.buildStateSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private resetBuffer(reason: string): void {
    this.sequenceBuffer.reset(reason);
    this.strokeTracker.reset();
    this.notifySubscribers();
  }
}

export function createKeyboard<
  TActionId extends string = string,
  const TKeymap extends Record<string, TActionId> = Keymap<TActionId>
>(config: KeyboardConfig<TActionId, TKeymap>): Keyboard<TActionId, TKeymap> {
  return new Keyboard<TActionId, TKeymap>(config);
}
