import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const baseClassName =
  "self-start text-sm text-fg border border-line rounded-xs px-3 py-1.5 hover:text-accent";

export function Button({
  children,
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={className ? `${baseClassName} ${className}` : baseClassName}
      {...props}
    >
      {children}
    </button>
  );
}
