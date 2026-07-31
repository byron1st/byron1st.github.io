interface MarkerListProps {
  items: readonly string[];
  marker: string;
  className?: string;
  itemClassName?: string;
}

export function MarkerList({
  items,
  marker,
  className = "flex flex-col gap-1",
  itemClassName = "text-sm text-muted",
}: MarkerListProps) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`grid grid-cols-[0.875rem_1fr] gap-2 ${itemClassName}`}
        >
          <span className="text-faint" aria-hidden="true">
            {marker}
          </span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}
