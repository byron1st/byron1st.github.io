const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Parse YYYY-MM-DD without Date/Intl so TZ and locale cannot shift the result. */
function parseYmd(isoDate: string): {
  year: number;
  month: number;
  day: number;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error(`Invalid date "${isoDate}"; expected YYYY-MM-DD`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid date "${isoDate}"`);
  }
  return { year, month, day };
}

/** "2026-06-14" → "Jun 14" */
export function formatShortDate(isoDate: string): string {
  const { month, day } = parseYmd(isoDate);
  return `${MONTHS[month - 1]} ${day}`;
}

/** "2026-04-02" → "2026-04-02" (normalized zero-padded ISO date) */
export function formatIsoDate(isoDate: string): string {
  const { year, month, day } = parseYmd(isoDate);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
