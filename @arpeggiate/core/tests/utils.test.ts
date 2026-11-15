import { describe, expect, it } from "bun:test";
import {
  type NextToken,
  type Trim,
  type TrimLeft,
  type TrimRight,
  type Whitespace,
} from "../src/utils.js";

type Fn<T> = <G>() => G extends T ? 1 : 2;
type Equal<X, Y> = Fn<X> extends Fn<Y> ? true : false;
type Expect<T extends true> = T;

describe("Type Utilities", () => {
  it("defines Whitespace union containing standard whitespace characters", () => {
    type Actual = Whitespace;
    type Expected = " " | "\t" | "\n" | "\r";
    type Test = Expect<Equal<Actual, Expected>>;
    const test: Test = true;
    expect(test).toBe(true);
  });

  it("trims leading whitespace from string literals", () => {
    type T1 = Expect<Equal<TrimLeft<"  hello">, "hello">>;
    type T2 = Expect<Equal<TrimLeft<"\t\nhello">, "hello">>;
    type T3 = Expect<Equal<TrimLeft<"hello  ">, "hello  ">>;
    type T4 = Expect<Equal<TrimLeft<"">, "">>;
    const t: T1 & T2 & T3 & T4 = true;
    expect(t).toBe(true);
  });

  it("trims trailing whitespace from string literals", () => {
    type T1 = Expect<Equal<TrimRight<"hello  ">, "hello">>;
    type T2 = Expect<Equal<TrimRight<"hello\t\n">, "hello">>;
    type T3 = Expect<Equal<TrimRight<"  hello">, "  hello">>;
    type T4 = Expect<Equal<TrimRight<"">, "">>;
    const t: T1 & T2 & T3 & T4 = true;
    expect(t).toBe(true);
  });

  it("trims both leading and trailing whitespace from string literals", () => {
    type T1 = Expect<Equal<Trim<"  hello  ">, "hello">>;
    type T2 = Expect<Equal<Trim<"\t\nhello\r ">, "hello">>;
    type T3 = Expect<Equal<Trim<"hello">, "hello">>;
    type T4 = Expect<Equal<Trim<"   ">, "">>;
    type T5 = Expect<Equal<Trim<"">, "">>;
    const t: T1 & T2 & T3 & T4 & T5 = true;
    expect(t).toBe(true);
  });

  it("extracts next token delimited by whitespace and trims remainder", () => {
    type T1 = Expect<Equal<NextToken<"hello world">, ["hello", "world"]>>;
    type T2 = Expect<
      Equal<NextToken<"first \t\n second">, ["first", "second"]>
    >;
    type T3 = Expect<Equal<NextToken<"single">, ["single", ""]>>;
    type T4 = Expect<Equal<NextToken<"">, ["", ""]>>;
    const t: T1 & T2 & T3 & T4 = true;
    expect(t).toBe(true);
  });
});

