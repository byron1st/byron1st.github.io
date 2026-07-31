import { useTheme } from "../hooks/useTheme";
import { Moon } from "./icons/Moon";
import { Sun } from "./icons/Sun";

export function ThemeToggle() {
  const { toggle } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="text-faint hover:text-fg"
      onClick={toggle}
    >
      {/* Icon visibility is CSS-only so prerender HTML matches hydration. */}
      <Moon className="size-4 block dark:hidden" />
      <Sun className="size-4 hidden dark:block" />
    </button>
  );
}
