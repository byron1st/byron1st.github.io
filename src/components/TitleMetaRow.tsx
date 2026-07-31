import type { ReactNode } from "react";

interface TitleMetaRowProps {
  title: ReactNode;
  meta: ReactNode;
}

export function TitleMetaRow({ title, meta }: TitleMetaRowProps) {
  return (
    <div className="flex justify-between gap-4 items-baseline">
      {title}
      {meta}
    </div>
  );
}
