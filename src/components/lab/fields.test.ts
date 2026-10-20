import { describe, expect, it } from "vitest";
import { FIELD_LIMIT, parseIntField } from "./fields";

describe("parseIntField", () => {
  it("aceita inteiros dentro do limite", () => {
    expect(parseIntField("42")).toBe(42);
    expect(parseIntField(" -3 ")).toBe(-3);
    expect(parseIntField(String(FIELD_LIMIT))).toBe(FIELD_LIMIT);
  });

  it("recusa o que parseInt truncaria", () => {
    expect(parseIntField("2.9")).toBeNull();
    expect(parseIntField("1e3")).toBeNull();
    expect(parseIntField("12abc")).toBeNull();
  });

  it("recusa vazio e valores grandes demais", () => {
    expect(parseIntField("")).toBeNull();
    expect(parseIntField("   ")).toBeNull();
    expect(parseIntField(String(FIELD_LIMIT + 1))).toBeNull();
    expect(parseIntField("99999999999999999999")).toBeNull();
  });
});
