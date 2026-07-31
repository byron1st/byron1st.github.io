interface IconProps {
  className?: string;
}

export function Mail({ className }: IconProps) {
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
      <rect x="2" y="4.5" width="20" height="15" rx="2" />
      <path d="M2.5 6.5L12 13.5l9.5-7" />
    </svg>
  );
}
