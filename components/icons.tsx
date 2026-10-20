import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export function LogoMark({ className = "", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden {...props}>
      <rect width="32" height="32" rx="9" fill="#0A0A0A" />
      <path
        d="M9 21.5V10.5h4.6c2.4 0 3.9 1.3 3.9 3.4 0 1.5-.8 2.6-2.1 3.1l2.6 4.5h-2.6l-2.3-4.1h-1.7v4.1H9Z"
        fill="#fff"
      />
      <circle cx="22.5" cy="11.5" r="2.2" fill="#fff" opacity="0.65" />
      <circle cx="22.5" cy="19.5" r="2.2" fill="#fff" opacity="0.35" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v3m0 12v3M4.2 7.5l2.1 2.1m11.4 11.4 2.1 2.1M3 12h3m12 0h3M4.2 16.5l2.1-2.1m11.4-11.4 2.1-2.1" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h13m0 0-5.5-5.5M18 12l-5.5 5.5" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6.5A2.5 2.5 0 0 0 4 5.5v6A2.5 2.5 0 0 0 6.5 14" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.5 3 19.5h18L12 4.5Z" />
      <path d="M12 10v4.5M12 17.4h.01" />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13.5 3 5.8 13.2h5l-.9 7.8 7.7-10.2h-5l.9-7.8Z" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 2.8v5.6c0 4.3-2.9 7.6-7 9.6-4.1-2-7-5.3-7-9.6V5.8L12 3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 7h15M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7m2.5 0v11.5A1.5 1.5 0 0 1 15.5 20h-7A1.5 1.5 0 0 1 7 18.5V7" />
    </svg>
  );
}

export function SpinnerIcon({ className = "", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`} aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Brand marks use their own official colors. */

export function LinkedInIcon({ className = "", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6.5 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.2 1.46-2.2 2.96V21h-4V9Z" />
    </svg>
  );
}

export function XIcon({ className = "", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
      <path d="M17.53 3h3.05l-6.66 7.61L21.75 21h-6.1l-4.28-5.6L6.4 21H3.35l7.12-8.14L2.75 3h6.26l3.87 5.12L17.53 3Zm-1.07 16.16h1.69L7.62 4.74H5.8l10.66 14.42Z" />
    </svg>
  );
}

export function InstagramIcon({ className = "", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.9" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
