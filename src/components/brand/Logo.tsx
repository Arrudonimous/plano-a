export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="64" height="64" rx="16" className="fill-primary" />
      <path
        d="M19 47 32 20l13 27M24.5 38h15"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
      <circle cx="46" cy="17" r="5" className="fill-accent" />
    </svg>
  );
}

export function Logo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span className="font-semibold tracking-tight text-primary">Plano A</span>
    </span>
  );
}
