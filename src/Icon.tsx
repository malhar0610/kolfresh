import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'fish' | 'bag' | 'search' | 'chevron' | 'clock' | 'check' | 'plus' | 'minus'
  | 'close' | 'pin' | 'delivery' | 'pickup' | 'leaf' | 'sparkles' | 'arrowRight'
  | 'back' | 'bell' | 'home' | 'box' | 'knife' | 'shield' | 'star' | 'menu'
  | 'refresh' | 'filter' | 'phone' | 'map' | 'discount' | 'calendar' | 'user';

const drawings: Record<IconName, ReactNode> = {
  fish: <><path d="M3 12s4.2-6.5 11-6.5S25 12 25 12s-4.2 6.5-11 6.5S3 12 3 12Z"/><path d="m21 9 3-3v12l-3-3M7 12h.01M10 12h.01M13 12h.01"/><circle cx="18" cy="10" r=".8" fill="currentColor" stroke="none"/></>,
  bag: <><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
  chevron: <path d="m7 10 5 5 5-5"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  check: <path d="m5 12 4.2 4L19 6.5"/>,
  plus: <path d="M12 5v14M5 12h14"/>,
  minus: <path d="M5 12h14"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.2"/></>,
  delivery: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7.5" cy="19" r="1.7"/><circle cx="17.5" cy="19" r="1.7"/></>,
  pickup: <><path d="M4 10h16l-1.4 10H5.4L4 10Z"/><path d="M8 10a4 4 0 0 1 8 0M8 14h.01M12 14h.01M16 14h.01"/></>,
  leaf: <><path d="M20 4C9 4 4 8 4 15a5 5 0 0 0 5 5c7 0 11-5 11-16Z"/><path d="M4 21c3-5 7-8 12-11"/></>,
  sparkles: <><path d="m12 3 1.2 4.8L18 9l-4.8 1.2L12 15l-1.2-4.8L6 9l4.8-1.2L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  back: <><path d="M19 12H5M11 18l-6-6 6-6"/></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></>,
  home: <><path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-6h6v6"/></>,
  box: <><path d="m12 3 9 4.8v8.7l-9 4.8-9-4.8V7.8L12 3Z"/><path d="m3.5 7.8 8.5 4.6 8.5-4.6M12 12.4v8.7"/></>,
  knife: <><path d="m20 4-8.5 8.5M20 4c-5 0-9 1-12 4l-4 4 8 8 4-4c3-3 4-7 4-12Z"/><path d="m4 20 5-5"/></>,
  shield: <><path d="m12 3 8 3v5c0 5-3.3 8.2-8 10-4.7-1.8-8-5-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 9a7 7 0 0 1 12-2l2 2M4 15l2 2a7 7 0 0 0 12-2"/></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4"/></>,
  phone: <><path d="M6 3h4l2 5-3 2a14 14 0 0 0 5 5l2-3 5 2v4c0 1-1 2-2 2C10 20 4 14 4 5c0-1 1-2 2-2Z"/></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/></>,
  discount: <><path d="M3 12V5h7l11 11-5 5L5 10V5"/><circle cx="7.3" cy="7.3" r=".8" fill="currentColor" stroke="none"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {drawings[name]}
    </svg>
  );
}
