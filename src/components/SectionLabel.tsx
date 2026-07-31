import type { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  hasBorder?: boolean;
}

export function SectionLabel({
  children,
  hasBorder = false,
}: SectionLabelProps) {
  return (
    <h2
      className={
        hasBorder
          ? "text-xs uppercase tracking-widest text-faint pb-1.5 border-b border-line"
          : "text-xs uppercase tracking-widest text-faint"
      }
    >
      {children}
    </h2>
  );
}
