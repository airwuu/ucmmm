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
    twitter: "https://twitter.com/getnextui",
    docs: "https://nextui.org",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
