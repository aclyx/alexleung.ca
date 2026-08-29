type NavLink = {
  id: string;
  href: string;
  canonicalPath: string;
  label: string;
};

export const NAV_LINKS: readonly NavLink[] = [
  {
    id: "experience",
    href: "/#experience",
    canonicalPath: "/#experience",
    label: "Experience",
  },
  {
    id: "writing",
    href: "/blog/",
    canonicalPath: "/blog",
    label: "Writing",
  },
  { id: "now", href: "/now/", canonicalPath: "/now", label: "Now" },
  {
    id: "contact",
    href: "/contact/",
    canonicalPath: "/contact",
    label: "Contact",
  },
];
