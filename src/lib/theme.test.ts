import { describe, expect, it } from "vitest";

import { resolveTheme } from "./theme";

describe("resolveTheme", () => {
  it("prefers a valid localStorage value over the system preference", () => {
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("light", true)).toBe("light");
  });

  it("accepts only exact light/dark storage tokens", () => {
    expect(resolveTheme("light", undefined)).toBe("light");
    expect(resolveTheme("dark", undefined)).toBe("dark");
  });

  it("falls back to prefers-color-scheme when storage is empty or invalid", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(undefined, false)).toBe("light");
    expect(resolveTheme("nope", true)).toBe("dark");
    expect(resolveTheme("nope", false)).toBe("light");
    // Empty string and case variants are not stored themes.
    expect(resolveTheme("", true)).toBe("dark");
    expect(resolveTheme("Dark", true)).toBe("dark");
    expect(resolveTheme("LIGHT", false)).toBe("light");
  });

  it("defaults to light when neither storage nor preference applies", () => {
    expect(resolveTheme(null, undefined)).toBe("light");
    expect(resolveTheme(undefined, undefined)).toBe("light");
    expect(resolveTheme(null, false)).toBe("light");
    expect(resolveTheme("", undefined)).toBe("light");
  });
});
