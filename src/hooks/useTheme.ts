import { useCallback, useState } from "react";

import type { Theme } from "../lib/theme";

function readDocumentTheme(): Theme {
  // SSG has no document; default light so prerender HTML is stable.
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "dark" ? "dark" : "light";
}

function writeTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Safari private mode and similar: attribute still applies for this session.
  }
}

export function useTheme(): {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
} {
  // Initializer reads the attribute the pre-paint script already set.
  const [theme, setThemeState] = useState<Theme>(readDocumentTheme);

  const setTheme = useCallback((next: Theme) => {
    writeTheme(next);
    setThemeState(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [setTheme, theme]);

  return { theme, setTheme, toggle };
}
