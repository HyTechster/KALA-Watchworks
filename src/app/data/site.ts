// Global site copy: brand, navigation, hero, ticker, final CTA and footer.

export interface NavLink {
  readonly id: string;
  readonly label: string;
}

export interface FooterLinkColumn {
  readonly title: string;
  readonly links: readonly { readonly label: string; readonly href: string }[];
}

export type SocialIcon = 'camera' | 'film' | 'mail' | 'rss';

export interface SocialLink {
  readonly label: string;
  readonly href: string;
  readonly icon: SocialIcon;
}

export const BRAND = {
  name: 'KALA',
  full: 'KALA Watchworks',
  meaning: '"Kala" means time in Malay.',
  city: 'Kuala Lumpur',
  disclaimer: 'KALA Watchworks is a fictional brand created for a design portfolio.',
  credit: 'Designed & built by Wan Amirul Amir @ HyTechster',
  skipLink: 'Skip to content',
} as const;

export const NAV = {
  label: 'Primary',
  links: [
    { id: 'craft', label: 'Craft' },
    { id: 'collection', label: 'Collection' },
    { id: 'movement', label: 'Movement' },
    { id: 'configurator', label: 'Configure' },
    { id: 'precision', label: 'Precision' },
  ] as readonly NavLink[],
  reserve: 'Reserve',
  timeLabel: 'Your local time',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  menuTitle: 'Menu',
  menuFooter: 'Series 03 · Limited to 88 pieces',
} as const;

export const PRELOADER = {
  label: 'Winding',
  status: 'Winding the mainspring',
  ready: 'Ready',
} as const;

export const HERO = {
  eyebrow: 'Series 03 · Hand-assembled in Kuala Lumpur',
  headlineLines: ['Every second,', 'made by hand.'] as readonly string[],
  headline: 'Every second, made by hand.',
  subline: 'Mechanical watches assembled one at a time, by one watchmaker, from 214 parts.',
  primaryCta: 'Explore the collection',
  secondaryCta: 'See the movement',
  specReserve: 'Power reserve 72 h',
  specFrequency: '28,800 vph',
  specLocalTime: 'Your local time',
  scrollCue: 'Scroll to turn the watch',
  casebackCaption: 'Exhibition caseback · Calibre K-03, visible and beating',
  canvasDescription:
    'A slowly lit KALA Series 03 watch with a teal dial. Its hands show your local time. As you scroll, it turns around to reveal the balance wheel beating behind a sapphire caseback.',
} as const;

export const TICKER = {
  series: 'Series 03',
  limited: 'Limited to 88 pieces',
  releaseLabel: 'Release in',
  reservedLabel: 'Pieces reserved',
  reserved: 76,
  total: 88,
  // Release countdown anchor. It rolls forward in fixed cycles so the fictional release is always ahead.
  releaseAnchor: '2026-10-14T10:00:00+08:00',
  cycleDays: 28,
  daysUnit: 'days',
  hoursUnit: 'hrs',
  minutesUnit: 'min',
} as const;

export const FINAL_CTA = {
  eyebrow: 'Series 03',
  headline: 'Time, well kept.',
  body: 'Twelve pieces of Series 03 remain. Each one is finished, cased and regulated by the same pair of hands, then delivered with its own rate certificate.',
  cta: 'Reserve Series 03',
  note: 'No payment until your piece is finished.',
} as const;

export const FOOTER = {
  wordmark: 'KALA',
  tagline: 'Independent mechanical watchmaking since 2019. One bench, one watchmaker, 214 parts at a time.',
  columns: [
    {
      title: 'Watches',
      links: [
        { label: 'Collection', href: '#collection' },
        { label: 'Configure', href: '#configurator' },
        { label: 'The movement', href: '#movement' },
        { label: 'Series 03', href: '#top' },
      ],
    },
    {
      title: 'Atelier',
      links: [
        { label: 'The craft', href: '#craft' },
        { label: 'Precision', href: '#precision' },
        { label: 'Anatomy of a second', href: '#anatomy' },
        { label: 'Owner voices', href: '#voices' },
      ],
    },
    {
      title: 'Care',
      links: [
        { label: 'Servicing', href: '#faq' },
        { label: 'Warranty', href: '#faq' },
        { label: 'Winding guide', href: '#faq' },
        { label: 'Water resistance', href: '#faq' },
      ],
    },
  ] as readonly FooterLinkColumn[],
  newsletterTitle: 'Letters from the bench',
  newsletterBody: 'One short letter per finished series. No noise, no discounts.',
  newsletterLabel: 'Email address',
  newsletterPlaceholder: 'you@example.com',
  newsletterSubmit: 'Subscribe',
  newsletterRequired: 'Please enter your email address.',
  newsletterInvalid: 'That email address does not look complete.',
  newsletterSuccess: 'Thank you. The next letter will find you.',
  socials: [
    { label: 'Instagram', href: 'https://instagram.com', icon: 'camera' },
    { label: 'Film journal', href: 'https://vimeo.com', icon: 'film' },
    { label: 'Email the atelier', href: 'mailto:atelier@kala.example', icon: 'mail' },
    { label: 'Journal feed', href: '#top', icon: 'rss' },
  ] as readonly SocialLink[],
  backToTop: 'Back to top',
  navLabel: 'Footer',
  copyright: '© 2026 KALA Watchworks',
  location: 'Kuala Lumpur · 3.139° N, 101.687° E',
} as const;
