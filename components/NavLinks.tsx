"use client";

/**
 * The site nav's link list, and the whole client island in the chrome. "use client" buys exactly
 * one thing: usePathname, for aria-current on the active link. Everything around it (brand, the
 * app button, the header) is rendered by the server component in components/Nav.tsx.
 *
 * DELIBERATELY ABSENT: a "Home" link (the wordmark is the way home), Risks and Legal (those live
 * in the footer), Docs-as-text (the GitBook mark in the top-right is the docs), any wallet or
 * connect control, and any JS menu.
 *
 * Exact-match active test only: a prefix test would light every link that shares a prefix.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const LINKS = [{ href: "/how-it-works", label: "How it works" }] as const;

/* The outline is inset (-2px offset) because the mobile row is an overflow container, which would
   clip an outline drawn outside the link. */
const LINK =
  "block whitespace-nowrap rounded-[10px] px-2.5 py-2 text-[15px] sm:px-3 font-medium no-underline transition-colors duration-150 focus-visible:outline-offset-[-2px]";
const IDLE = "text-ink-2 hover:bg-surface-2 hover:text-ink";
const ACTIVE = "bg-surface text-ink shadow-soft";

export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="flex gap-0.5 sm:gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(LINK, active ? ACTIVE : IDLE)}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
