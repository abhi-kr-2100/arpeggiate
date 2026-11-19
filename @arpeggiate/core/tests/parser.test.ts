import { describe, expect, it } from "bun:test";
import { parse, type Sequence } from "../src";

type Fn<T> = <G>() => G extends T ? 1 : 2;
type Equal<X, Y> = Fn<X> extends Fn<Y> ? true : false;
type Expect<T extends true> = T;

describe("Compile-Time Parsing", () => {
  it("parses single key stroke literal", () => {
    const parsed = parse("j");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"j">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("parses concurrent keys within a stroke literal", () => {
    const parsed = parse("Control+s");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"Control" | "s">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("parses consecutive strokes separated by sequence delimiter", () => {
    const parsed = parse("g g");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"g">, ReadonlySet<"g">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("parses three concurrent keys within a stroke literal", () => {
    const parsed = parse("Control+Shift+p");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"Control" | "Shift" | "p">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("parses arbitrary identifier key literal", () => {
    const parsed = parse("AudioVolumeUp10");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"AudioVolumeUp10">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("parses trailing plus delimiter collision literal", () => {
    const parsed = parse("Control++");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"Control" | "+">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("parses medial plus delimiter collision literal", () => {
    const parsed = parse("Control+++t");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"Control" | "+" | "t">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("parses leading plus delimiter collision literal", () => {
    const parsed = parse("++t");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"+" | "t">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("parses multiple concurrent keys with trailing plus delimiter collision literal", () => {
    const parsed = parse("Control+Shift++");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"Control" | "Shift" | "+">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("parses sequence with trailing plus delimiter collision stroke literal", () => {
    const parsed = parse("g Control++");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"g">, ReadonlySet<"Control" | "+">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("parses Space key with modifier literal", () => {
    const parsed = parse("Control+Space");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"Control" | "Space">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("parses isolated plus key literal", () => {
    const parsed = parse("+");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"+">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("parses consecutive strokes separated by whitespace runs", () => {
    const parsedTab = parse("g\tg");
    type ActualTab = typeof parsedTab;
    type ExpectedTab = readonly [ReadonlySet<"g">, ReadonlySet<"g">];
    type TestTab = Expect<Equal<ActualTab, ExpectedTab>>;
    const testTab: TestTab = true;
    expect(testTab).toBe(true);

    const parsedNewline = parse("g\ng");
    type ActualNewline = typeof parsedNewline;
    type ExpectedNewline = readonly [ReadonlySet<"g">, ReadonlySet<"g">];
    type TestNewline = Expect<Equal<ActualNewline, ExpectedNewline>>;
    const testNewline: TestNewline = true;
    expect(testNewline).toBe(true);

    const parsedMulti = parse("g  g");
    type ActualMulti = typeof parsedMulti;
    type ExpectedMulti = readonly [ReadonlySet<"g">, ReadonlySet<"g">];
    type TestMulti = Expect<Equal<ActualMulti, ExpectedMulti>>;
    const testMulti: TestMulti = true;
    expect(testMulti).toBe(true);

    const parsedMixed = parse("  g \t\n g  ");
    type ActualMixed = typeof parsedMixed;
    type ExpectedMixed = readonly [ReadonlySet<"g">, ReadonlySet<"g">];
    type TestMixed = Expect<Equal<ActualMixed, ExpectedMixed>>;
    const testMixed: TestMixed = true;
    expect(testMixed).toBe(true);
  });

  it("parses single stroke with leading and trailing whitespace", () => {
    const parsed = parse("  j  ");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"j">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("evaluates to never parameter for syntactically invalid literals", () => {
    type InvalidEmpty = Expect<Equal<Parameters<typeof parse<"">>[0], never>>;
    type InvalidDangling = Expect<
      Equal<Parameters<typeof parse<"Control+">>[0], never>
    >;
    type InvalidLeading = Expect<
      Equal<Parameters<typeof parse<"+s">>[0], never>
    >;
    type InvalidNonTerminal = Expect<
      Equal<Parameters<typeof parse<"Control++s">>[0], never>
    >;
    type InvalidWhitespaceOnly = Expect<
      Equal<Parameters<typeof parse<"   ">>[0], never>
    >;
    type InvalidWhitespaceTabNewline = Expect<
      Equal<Parameters<typeof parse<"\t\n\r ">>[0], never>
    >;
    type InvalidTail = Expect<
      Equal<Parameters<typeof parse<"Control+s+\t">>[0], never>
    >;
    type InvalidIntermediateKey = Expect<
      Equal<Parameters<typeof parse<"Control+\t+s">>[0], never>
    >;
    type InvalidTrailingPlusStroke = Expect<
      Equal<Parameters<typeof parse<"g ++">>[0], never>
    >;

    const check: InvalidEmpty &
      InvalidDangling &
      InvalidLeading &
      InvalidNonTerminal &
      InvalidWhitespaceOnly &
      InvalidWhitespaceTabNewline &
      InvalidTail &
      InvalidIntermediateKey &
      InvalidTrailingPlusStroke = true;
    expect(check).toBe(true);

    // @ts-expect-error - rejects empty sequence string literal at normal call site
    () => parse("");
    // @ts-expect-error - rejects trailing dangling delimiter stroke literal at normal call site
    () => parse("Control+");
    // @ts-expect-error - rejects leading delimiter stroke literal at normal call site
    () => parse("+s");
    // @ts-expect-error - rejects non-terminal adjacent delimiters stroke literal at normal call site
    () => parse("Control++s");
    // @ts-expect-error - rejects whitespace-only sequence literal at normal call site
    () => parse("   ");
    // @ts-expect-error - rejects tab and newline only sequence literal at normal call site
    () => parse("\t\n\r ");
    // @ts-expect-error - rejects whitespace creating dangling delimiter at normal call site
    () => parse("Control+s+\t");
    // @ts-expect-error - rejects whitespace splitting key within stroke at normal call site
    () => parse("Control+\t+s");
    // @ts-expect-error - rejects trailing plus delimiter collision stroke literal at normal call site
    () => parse("g ++");
  });

  it("infers strongly typed Sequence when parse is called with string literal", () => {
    const parsed = parse("Control+s");
    type Actual = typeof parsed;
    type Expected = readonly [ReadonlySet<"Control" | "s">];
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("returns Sequence when parse is called with dynamic string", () => {
    const dynamicInput: string = "Control+s";
    const parsed = parse(dynamicInput);
    type Actual = typeof parsed;
    type Expected = Sequence;
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
    expect(parsed).toEqual([new Set(["Control", "s"])]);
  });

  it("resolves widened string type parameter to Sequence", () => {
    type ActualParam = Parameters<typeof parse<string>>[0];
    type ExpectedParam = string;
    type TestParam = Expect<Equal<ActualParam, ExpectedParam>>;
    const testParam: TestParam = true;
    expect(testParam).toBe(true);

    const dynamicInput: string = "Control+s";
    const parsed = parse<string>(dynamicInput);
    type Actual = typeof parsed;
    type Expected = Sequence;
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
    expect(parsed).toEqual([new Set(["Control", "s"])]);
  });

  it("models Sequence as a non-empty tuple and disallows empty array", () => {
    type EmptyArrayAssignable = [] extends Sequence ? true : false;
    type Test = Expect<Equal<EmptyArrayAssignable, false>>;
    const test: Test = true;
    expect(test).toBe(true);
  });
});

describe("Public API Seam", () => {
  it("exports only parse as runtime entity on public module namespace", async () => {
    const mod = await import("../src");
    expect(Object.keys(mod)).toEqual(["parse"]);
  });
});

describe("Runtime Parsing", () => {
  it("parses a single key stroke into a Sequence", () => {
    const result = parse("j");
    expect(result).toEqual([new Set(["j"])]);
  });

  it("throws an error when parsing an empty sequence string", () => {
    expect(() => parse("" as string)).toThrow();
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
    expect(() => parse("Control+" as string)).toThrow();
  });

  it("throws an error when a stroke has non-terminal adjacent delimiters", () => {
    expect(() => parse("Control++s" as string)).toThrow();
  });

  it("throws an error for invalid plus collision variants", () => {
    expect(() => parse("++" as string)).toThrow();
    expect(() => parse("g ++" as string)).toThrow();
    expect(() => parse("Control+++" as string)).toThrow();
    expect(() => parse("+Control++" as string)).toThrow();
    expect(() => parse("Control++Shift++" as string)).toThrow();
  });

  it("throws an error when a stroke has leading delimiter", () => {
    expect(() => parse("+s" as string)).toThrow();
  });

  it("permits leading, trailing, and multiple whitespace characters", () => {
    expect(parse(" g" as string)).toEqual([new Set(["g"])]);
    expect(parse("g " as string)).toEqual([new Set(["g"])]);
    expect(parse("g  g" as string)).toEqual([new Set(["g"]), new Set(["g"])]);
    expect(parse("  g \t\n g  " as string)).toEqual([
      new Set(["g"]),
      new Set(["g"]),
    ]);
  });

  it("parses consecutive strokes separated by tabs or newlines", () => {
    expect(parse("g\tg" as string)).toEqual([new Set(["g"]), new Set(["g"])]);
    expect(parse("g\ng" as string)).toEqual([new Set(["g"]), new Set(["g"])]);
  });

  it("throws an error when sequence contains only whitespace", () => {
    expect(() => parse("   " as string)).toThrow();
    expect(() => parse("\t\n\r " as string)).toThrow();
  });

  it("throws an error when whitespace is used within a stroke", () => {
    expect(() => parse("Control+\t+s" as string)).toThrow();
    expect(() => parse("Control+s+\t" as string)).toThrow();
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
