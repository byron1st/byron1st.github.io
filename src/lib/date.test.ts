import { describe, expect, it } from "vitest";

import { formatIsoDate, formatShortDate } from "./date";

describe("formatShortDate", () => {
  it("formats YYYY-MM-DD as Mon D without a leading zero on the day", () => {
    expect(formatShortDate("2026-06-14")).toBe("Jun 14");
    expect(formatShortDate("2026-04-02")).toBe("Apr 2");
  });

  // Pure string parse — no Date/Intl — so host TZ/locale cannot change the result.
  it("does not depend on the host timezone or locale", () => {
    expect(formatShortDate("2026-01-01")).toBe("Jan 1");
    expect(formatShortDate("2026-12-31")).toBe("Dec 31");
  });

  it("maps every month index to its three-letter label", () => {
    expect(formatShortDate("2026-01-15")).toBe("Jan 15");
    expect(formatShortDate("2026-02-15")).toBe("Feb 15");
    expect(formatShortDate("2026-03-15")).toBe("Mar 15");
    expect(formatShortDate("2026-04-15")).toBe("Apr 15");
    expect(formatShortDate("2026-05-15")).toBe("May 15");
    expect(formatShortDate("2026-06-15")).toBe("Jun 15");
    expect(formatShortDate("2026-07-15")).toBe("Jul 15");
    expect(formatShortDate("2026-08-15")).toBe("Aug 15");
    expect(formatShortDate("2026-09-15")).toBe("Sep 15");
    expect(formatShortDate("2026-10-15")).toBe("Oct 15");
    expect(formatShortDate("2026-11-15")).toBe("Nov 15");
    expect(formatShortDate("2026-12-15")).toBe("Dec 15");
  });

  it("throws when the string is not YYYY-MM-DD", () => {
    expect(() => formatShortDate("2026/06/14")).toThrow(
      /Invalid date "2026\/06\/14"; expected YYYY-MM-DD/,
    );
    expect(() => formatShortDate("")).toThrow(/expected YYYY-MM-DD/);
    expect(() => formatShortDate("2026-6-14")).toThrow(/expected YYYY-MM-DD/);
  });

  it("throws when month or day is out of range", () => {
    expect(() => formatShortDate("2026-00-14")).toThrow(
      /Invalid date "2026-00-14"/,
    );
    expect(() => formatShortDate("2026-13-01")).toThrow(
      /Invalid date "2026-13-01"/,
    );
    expect(() => formatShortDate("2026-06-00")).toThrow(
      /Invalid date "2026-06-00"/,
    );
    expect(() => formatShortDate("2026-06-32")).toThrow(
      /Invalid date "2026-06-32"/,
    );
  });
});

describe("formatIsoDate", () => {
  it("returns a zero-padded YYYY-MM-DD string", () => {
    expect(formatIsoDate("2026-04-02")).toBe("2026-04-02");
    expect(formatIsoDate("2026-06-14")).toBe("2026-06-14");
  });

  it("does not depend on the host timezone or locale", () => {
    expect(formatIsoDate("2026-01-01")).toBe("2026-01-01");
    expect(formatIsoDate("2026-12-31")).toBe("2026-12-31");
  });

  it("throws when the string is not YYYY-MM-DD", () => {
    expect(() => formatIsoDate("14-06-2026")).toThrow(
      /Invalid date "14-06-2026"; expected YYYY-MM-DD/,
    );
  });

  it("throws when month or day is out of range", () => {
    expect(() => formatIsoDate("2026-00-01")).toThrow(/Invalid date/);
    expect(() => formatIsoDate("2026-01-32")).toThrow(/Invalid date/);
  });
});
