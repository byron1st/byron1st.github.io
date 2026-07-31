export type Theme = "light" | "dark";

/** Pure theme decision: localStorage value → prefers-color-scheme → light. */
export function resolveTheme(
  stored: string | null | undefined,
  prefersDark: boolean | undefined,
): Theme {
  if (stored === "light" || stored === "dark") return stored;
  if (prefersDark === true) return "dark";
  return "light";
}
