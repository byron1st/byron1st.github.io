interface IconProps {
  className?: string;
}

export function GitHub({ className }: IconProps) {
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
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.4 4.4-2.2 4.4-5.3a4.9 4.9 0 0 0-1.3-3.4 4.6 4.6 0 0 0-.1-3.4s-1.5-.5-4.1 1.5a12.5 12.5 0 0 0-6.6 0C6.9 2.5 5.4 2.9 5.4 2.9a4.6 4.6 0 0 0-.1 3.4A4.9 4.9 0 0 0 4 9.8c0 3.1 1.3 4.9 4.4 5.3a3.4 3.4 0 0 0-.9 2.6V22" />
    </svg>
  );
}
