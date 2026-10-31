/**
 * @packageDocumentation
 * Headless keyboard shortcuts engine built from mathematical first principles.
 *
 * Provides zero-dependency, 100% compile-time type-safe keyboard shortcut handling
 * with zero runtime validation overhead.
 */

export { createKeyboard } from "./engine.js";

export type {
  Keymap,
  ValidatedKeymap,
  KeyboardConfig,
  KeyboardController,
} from "./types.js";
