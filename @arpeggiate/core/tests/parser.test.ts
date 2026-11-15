import { describe, expect, it } from "bun:test";
import { parse, type Stroke, type Sequence } from "../src";

type Fn<T> = <G>() => G extends T ? 1 : 2;
type Equal<X, Y> = Fn<X> extends Fn<Y> ? true : false;
type Expect<T extends true> = T;

describe("Public API Seam", () => {
  it("exports only parse as runtime entity on public module namespace", async () => {
    const mod = await import("../src");
    expect(Object.keys(mod)).toEqual(["parse"]);
  });

  it("models Sequence as a non-empty tuple of Strokes", () => {
    type EmptyArrayAssignable = [] extends Sequence ? true : false;
    type Test = Expect<Equal<EmptyArrayAssignable, false>>;
    const test: Test = true;
    expect(test).toBe(true);

    type ValidSequence = readonly [Stroke, ...Stroke[]];
    type Match = Expect<Equal<Sequence, ValidSequence>>;
    const match: Match = true;
    expect(match).toBe(true);
  });
});

describe("Runtime Parsing", () => {
  it("parses a single key stroke into a Sequence", () => {
    const result = parse("j");
    expect(result).toEqual([new Set(["j"])]);
  });

  it("throws an error when parsing an empty sequence string", () => {
    expect(() => parse("")).toThrow();
  });

  it("parses consecutive strokes separated by space", () => {
    const result = parse("g g");
    expect(result).toEqual([new Set(["g"]), new Set(["g"])]);
  });

  it("parses multiple concurrent keys within a stroke", () => {
    const result = parse("Control+s");
    expect(result).toEqual([new Set(["Control", "s"])]);
  });

  it("parses trailing plus delimiter collision in a stroke", () => {
    const result = parse("Control++");
    expect(result).toEqual([new Set(["Control", "+"])]);
  });

  it("parses medial plus delimiter collision in a stroke", () => {
    const result = parse("Control+++t");
    expect(result).toEqual([new Set(["Control", "+", "t"])]);
  });

  it("parses leading plus delimiter collision in a stroke", () => {
    const result = parse("++t");
    expect(result).toEqual([new Set(["+", "t"])]);
  });

  it("parses multiple concurrent keys with trailing plus delimiter collision in a stroke", () => {
    const result = parse("Control+Shift++");
    expect(result).toEqual([new Set(["Control", "Shift", "+"])]);
  });

  it("parses sequence with trailing plus delimiter collision stroke", () => {
    const result = parse("g Control++");
    expect(result).toEqual([new Set(["g"]), new Set(["Control", "+"])]);
  });

  it("parses isolated plus key", () => {
    const result = parse("+");
    expect(result).toEqual([new Set(["+"])]);
  });

  it("parses Space key", () => {
    const result = parse("Space");
    expect(result).toEqual([new Set(["Space"])]);
  });

  it("throws an error when a stroke has a trailing dangling delimiter", () => {
    expect(() => parse("Control+")).toThrow();
  });

  it("throws an error when a stroke has non-terminal adjacent delimiters", () => {
    expect(() => parse("Control++s")).toThrow();
  });

  it("throws an error for invalid plus collision variants", () => {
    expect(() => parse("++")).toThrow();
    expect(() => parse("g ++")).toThrow();
    expect(() => parse("Control+++")).toThrow();
    expect(() => parse("+Control++")).toThrow();
    expect(() => parse("Control++Shift++")).toThrow();
  });

  it("throws an error when a stroke has leading delimiter", () => {
    expect(() => parse("+s")).toThrow();
  });

  it("permits leading, trailing, and multiple whitespace characters", () => {
    expect(parse(" g")).toEqual([new Set(["g"])]);
    expect(parse("g ")).toEqual([new Set(["g"])]);
    expect(parse("g  g")).toEqual([new Set(["g"]), new Set(["g"])]);
    expect(parse("  g \t\n g  ")).toEqual([
      new Set(["g"]),
      new Set(["g"]),
    ]);
  });

  it("parses consecutive strokes separated by tabs or newlines", () => {
    expect(parse("g\tg")).toEqual([new Set(["g"]), new Set(["g"])]);
    expect(parse("g\ng")).toEqual([new Set(["g"]), new Set(["g"])]);
  });

  it("parses consecutive strokes separated by form-feed, vertical-tab, Unicode whitespace, or BOM", () => {
    expect(parse("g\fg")).toEqual([new Set(["g"]), new Set(["g"])]);
    expect(parse("g\vg")).toEqual([new Set(["g"]), new Set(["g"])]);
    expect(parse("g\u00A0g")).toEqual([
      new Set(["g"]),
      new Set(["g"]),
    ]);
    expect(parse("\uFEFFg g\uFEFF")).toEqual([
      new Set(["g"]),
      new Set(["g"]),
    ]);
  });

  it("throws an error when sequence contains only whitespace", () => {
    expect(() => parse("   ")).toThrow();
    expect(() => parse("\t\n\r ")).toThrow();
    expect(() => parse("\f\v\u00A0\uFEFF")).toThrow();
  });

  it("throws an error when whitespace is used within a stroke", () => {
    expect(() => parse("Control+\t+s")).toThrow();
    expect(() => parse("Control+s+\t")).toThrow();
  });

  it("collapses duplicate keys within a stroke", () => {
    const result = parse("s+s");
    expect(result).toEqual([new Set(["s"])]);
  });

  it("preserves stroke order across sequence", () => {
    const result = parse("a b");
    expect(result).toEqual([new Set(["a"]), new Set(["b"])]);
  });
});
