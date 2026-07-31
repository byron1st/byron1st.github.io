import type { ComponentType } from "react";

import type { Social, SocialKind } from "../content/schema";
import { GitHub } from "./icons/GitHub";
import { LinkedIn } from "./icons/LinkedIn";
import { Mail } from "./icons/Mail";
import { X } from "./icons/X";

interface IconProps {
  className?: string;
}

// Record over SocialKind forces an exhaustive kind → icon map at compile time.
const ICONS: Record<SocialKind, ComponentType<IconProps>> = {
  github: GitHub,
  x: X,
  linkedin: LinkedIn,
  email: Mail,
};

interface SocialLinksProps {
  socials: readonly Social[];
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
}

export function SocialLinks({
  socials,
  className = "flex gap-3.5",
  linkClassName = "text-faint hover:text-fg",
  iconClassName = "size-4",
}: SocialLinksProps) {
  return (
    <div className={className}>
      {socials.map(({ kind, url }) => {
        const Icon = ICONS[kind];
        const external = kind !== "email";
        return (
          <a
            key={kind}
            href={url}
            aria-label={kind}
            className={linkClassName}
            {...(external
              ? { target: "_blank", rel: "noreferrer" }
              : undefined)}
          >
            <Icon className={iconClassName} />
          </a>
        );
      })}
    </div>
  );
}
