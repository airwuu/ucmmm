export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "ucmmm",
  description: "the better menu website",
  navItems: [
    {
      label: "about",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "About",
      href: "/about",
    },
    {
      label: "Help & Feedback",
      href: "/help-feedback",
    },
  ],
  links: {
    github: "https://github.com/airwuu/ucmmm",
  },
};
