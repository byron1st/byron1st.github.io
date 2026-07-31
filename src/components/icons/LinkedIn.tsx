interface IconProps {
  className?: string;
}

export function LinkedIn({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-13h4z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4.5" r="2" />
    </svg>
  );
}
