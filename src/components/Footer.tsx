import type { Social } from "../content/schema";

import { SocialLinks } from "./SocialLinks";

interface FooterProps {
  name: string;
  socials: readonly Social[];
  year: number;
}

export function Footer({ name, socials, year }: FooterProps) {
  return (
    <footer className="pt-20 mt-15 border-t border-line flex justify-between text-xs text-faint">
      <p>
        © {year} {name}
      </p>
      <SocialLinks socials={socials} />
    </footer>
  );
}
