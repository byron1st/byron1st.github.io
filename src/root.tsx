import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import "./styles/theme.css";

// Self-contained: cannot import modules. localStorage → prefers-color-scheme → light.
const THEME_BOOT =
  "(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);return;}}catch(e){}var dark=false;try{dark=window.matchMedia('(prefers-color-scheme: dark)').matches;}catch(e){}document.documentElement.setAttribute('data-theme',dark?'dark':'light');})();";

export function Layout({ children }: { children: ReactNode }) {
  // data-theme is owned by the boot script + useTheme, not by React attributes,
  // so hydration never fights a pre-paint preference.
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
