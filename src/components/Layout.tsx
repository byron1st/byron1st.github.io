import { Outlet } from "react-router";

import { profile } from "../content/profile";
import { Footer } from "./Footer";
import { Header } from "./Header";

// Layout is the only component allowed to import content/ (SPEC layer exception).
export default function Layout() {
  // Build-time year freezes at prerender — intentional for a static site.
  const year = new Date().getFullYear();

  return (
    <div className="max-w-2xl mx-auto pt-11 px-7 pb-30">
      <Header name={profile.name} />
      <main>
        <Outlet />
      </main>
      <Footer name={profile.name} socials={profile.socials} year={year} />
    </div>
  );
}
