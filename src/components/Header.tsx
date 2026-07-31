import { Link } from "react-router";

import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  name: string;
}

const NAV = [
  { to: "/about", label: "about" },
  { to: "/projects", label: "projects" },
  { to: "/posts", label: "posts" },
] as const;

export function Header({ name }: HeaderProps) {
  return (
    <header className="flex justify-between items-baseline gap-6 pb-3.5 border-b border-line">
      <div className="flex items-baseline gap-4.5 flex-wrap">
        <Link to="/" className="font-semibold tracking-tight">
          {name}
        </Link>
        <nav className="flex items-baseline gap-3.5 text-sm text-muted">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="border-b border-transparent hover:text-fg hover:border-line"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <ThemeToggle />
    </header>
  );
}
