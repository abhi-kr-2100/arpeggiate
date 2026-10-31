import { describe, expect, test } from "bun:test";
import type { ParseKeySequence, ParseStroke, ValidatedKeymap } from "../src/types.js";

describe("Type System & Compile-Time Grammar", () => {
  test("ParseStroke accepts free-form string keys", () => {
    type S1 = ParseStroke<"a">;
    type S2 = ParseStroke<"Control+k">;
    type S3 = ParseStroke<"AudioVolumeUpBy50">;
    type S4 = ParseStroke<"Unidentified">;
    type S5 = ParseStroke<"ñ">;
    type S6 = ParseStroke<"Ctl+k">;
    type S7 = ParseStroke<"Control++">;
    type S8 = ParseStroke<"+">;

    const s1: S1 = "a";
    const s2: S2 = "Control+k";
    const s3: S3 = "AudioVolumeUpBy50";
    const s4: S4 = "Unidentified";
    const s5: S5 = "ñ";
    const s6: S6 = "Ctl+k";
    const s7: S7 = "Control++";
    const s8: S8 = "+";

    expect(s1).toBe("a");
    expect(s2).toBe("Control+k");
    expect(s3).toBe("AudioVolumeUpBy50");
    expect(s4).toBe("Unidentified");
    expect(s5).toBe("ñ");
    expect(s6).toBe("Ctl+k");
    expect(s7).toBe("Control++");
    expect(s8).toBe("+");
  });

  test("ParseStroke rejects duplicate keys, empty stroke, and whitespace", () => {
    type Dup1 = ParseStroke<"j+j">;
    type Dup2 = ParseStroke<"Control+Control">;
    type Dup3 = ParseStroke<"a+b+a">;
    type Dup4 = ParseStroke<"AudioVolumeUpBy50+AudioVolumeUpBy50">;
    type Empty = ParseStroke<"">;
    type Space = ParseStroke<"Control k">;
    type Trailing = ParseStroke<"Control+">;
    type Leading = ParseStroke<"+k">;

    // All invalid strokes evaluate to never
    const _dup1: Dup1 extends never ? true : false = true;
    const _dup2: Dup2 extends never ? true : false = true;
    const _dup3: Dup3 extends never ? true : false = true;
    const _dup4: Dup4 extends never ? true : false = true;
    const _empty: Empty extends never ? true : false = true;
    const _space: Space extends never ? true : false = true;
    const _trailing: Trailing extends never ? true : false = true;
    const _leading: Leading extends never ? true : false = true;

    expect(_dup1).toBe(true);
    expect(_dup2).toBe(true);
    expect(_dup3).toBe(true);
    expect(_dup4).toBe(true);
    expect(_empty).toBe(true);
    expect(_space).toBe(true);
    expect(_trailing).toBe(true);
    expect(_leading).toBe(true);
  });

  test("ParseKeySequence validates multi-stroke sequences of free-form keys", () => {
    type Seq1 = ParseKeySequence<"g g">;
    type Seq2 = ParseKeySequence<"Control+k Enter">;
    type Seq3 = ParseKeySequence<"AudioVolumeUpBy50 AudioVolumeUpBy50">;

    const seq1: Seq1 = "g g";
    const seq2: Seq2 = "Control+k Enter";
    const seq3: Seq3 = "AudioVolumeUpBy50 AudioVolumeUpBy50";

    expect(seq1).toBe("g g");
    expect(seq2).toBe("Control+k Enter");
    expect(seq3).toBe("AudioVolumeUpBy50 AudioVolumeUpBy50");
  });

  test("ParseKeySequence rejects sequences with invalid strokes", () => {
    type BadSeq1 = ParseKeySequence<"j+j g">;
    type BadSeq2 = ParseKeySequence<"g j+j">;
    type BadSeq3 = ParseKeySequence<"g  g">;

    const _bad1: BadSeq1 extends never ? true : false = true;
    const _bad2: BadSeq2 extends never ? true : false = true;
    const _bad3: BadSeq3 extends never ? true : false = true;

    expect(_bad1).toBe(true);
    expect(_bad2).toBe(true);
    expect(_bad3).toBe(true);
  });

  test("ValidatedKeymap accepts free-form string keys in dictionary", () => {
    type MapType = ValidatedKeymap<{
      "AudioVolumeUpBy50": "vol";
      "Ctl+k": "palette";
      "ñ": "char";
      "Unidentified": "fallback";
    }>;

    const map: MapType = {
      AudioVolumeUpBy50: "vol",
      "Ctl+k": "palette",
      ñ: "char",
      Unidentified: "fallback",
    };

    expect(map.AudioVolumeUpBy50).toBe("vol");
    expect(map["Ctl+k"]).toBe("palette");
    expect(map.ñ).toBe("char");
    expect(map.Unidentified).toBe("fallback");
  });

  test("ValidatedKeymap produces error message literal for invalid key sequences", () => {
    type MapWithErrors = ValidatedKeymap<{
      "Control+k": "palette";
      "j+j": "invalid";
    }>;

    type K1 = MapWithErrors["Control+k"];
    type K2 = MapWithErrors["j+j"];

    const val1: K1 = "palette";
    expect(val1).toBe("palette");

    const val2: K2 = "Error: Invalid key sequence 'j+j'";
    expect(val2).toBe("Error: Invalid key sequence 'j+j'");
  });
});
