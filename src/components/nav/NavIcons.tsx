import type { ReactNode, SVGProps } from "react";

function Icon({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = () => (
  <Icon>
    <path d="M4 11.5 12 5l8 6.5" />
    <path d="M6 10.5V19h12v-8.5" />
    <path d="M10 19v-4.5h4V19" />
  </Icon>
);

export const StarIcon = () => (
  <Icon>
    <path d="m12 4 2.4 5 5.4.7-4 3.8 1 5.4L12 16.2 7.2 18.9l1-5.4-4-3.8 5.4-.7Z" />
  </Icon>
);

export const TargetIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" />
  </Icon>
);

export const ActionIcon = () => (
  <Icon>
    <path d="M5 19 19 5" />
    <path d="M9 5h10v10" />
  </Icon>
);

export const SettingsIcon = () => (
  <Icon>
    <path d="M5 7h9M18 7h1M5 12h1M10 12h9M5 17h5M14 17h5" />
    <circle cx="16" cy="7" r="1.8" />
    <circle cx="8" cy="12" r="1.8" />
    <circle cx="12" cy="17" r="1.8" />
  </Icon>
);
