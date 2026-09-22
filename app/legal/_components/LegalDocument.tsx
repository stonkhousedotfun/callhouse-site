/**
 * The document shell /legal, /terms and /privacy share in the Daylight design. Server components
 * only; nothing here hydrates.
 *
 * WHAT THIS FILE MAY DO: layout and type. /terms and /privacy are adopted legal documents;
 * /legal is an explanatory disclosure outside that set. Every reader-visible legal sentence is
 * written in the page files themselves; copy-lint was removed on 2026-09-21, so disclosure wording
 * must be checked manually. Nothing in here renders legal wording of its own. Its only strings are
 * navigation ("On this page" and section titles repeated from each page's h2 text). The version
 * chip was removed on 2026-09-21 with the rest of the legal versioning machinery.
 *
 * Layout: the page head (eyebrow, h1, optional chips) sits on the 1160px container. Under it, a
 * 65ch reading column; from 960px up, a sticky section list in a narrow column to its left. Below
 * 960px the same list is a native <details> disclosure at the top of the column (no script).
 * Each section's h2 carries the id the list links to, so a section is addressable from outside
 * too (/legal#reporting is the Policy target of /.well-known/security.txt and must keep that id).
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { Chip, Container, ExternalLink, SectionHead, WarnIcon } from "@/components/ui";
import { cn } from "@/lib/cn";

/** One row of the section list: the h2's id and its exact heading text. */
export type TocEntry = { readonly id: string; readonly title: string };

type LegalDocumentProps = {
  eyebrow: string;
  title: string;
  /** Optional metadata under the h1. */
  meta?: ReactNode;
  toc: readonly TocEntry[];
  children: ReactNode;
};

export function LegalDocument({ eyebrow, title, meta, toc, children }: LegalDocumentProps) {
  return (
    <>
      <Container className="pb-10 pt-8 sm:pb-12 lg:pt-12">
        <SectionHead level={1} eyebrow={eyebrow} title={title} className="mb-0! max-w-[52rem]" />
        {meta ? <div className="mt-6 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </Container>

      <Container>
        <div className="grid grid-cols-1 gap-x-20 border-t border-line pb-16 pt-10 sm:pb-24 sm:pt-14 lg:grid-cols-[220px_minmax(0,1fr)]">
          <TocSidebar toc={toc} />
          <div className="min-w-0 max-w-[65ch] text-[16.5px] leading-[1.7] text-ink-2 [&_em]:text-ink [&_strong]:font-semibold [&_strong]:text-ink">
            <TocDisclosure toc={toc} />
            {children}
          </div>
        </div>
      </Container>
    </>
  );
}

const TOC_LINK =
  "block rounded-sm py-1.5 text-[14px] leading-snug text-ink-2 no-underline transition-colors duration-150 hover:text-ink focus-visible:outline-offset-[-2px]";

/** Wide screens: the section list, sticky beside the reading column. */
function TocSidebar({ toc }: { toc: readonly TocEntry[] }) {
  return (
    <nav aria-labelledby="toc-heading" className="hidden lg:block">
      <div className="sticky top-8 max-h-[calc(100dvh-4rem)] overflow-y-auto pb-2">
        <p
          id="toc-heading"
          className="font-body text-[12.5px] font-bold uppercase leading-none tracking-[0.1em] text-ink-3"
        >
          On this page
        </p>
        <ol className="mt-4 border-l border-line">
          {toc.map((entry) => (
            <li key={entry.id} className="-ml-px border-l border-transparent pl-4 hover:border-ink-3">
              <a href={`#${entry.id}`} className={TOC_LINK}>
                {entry.title}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

/** Narrow screens: the same list, folded into a disclosure above the first paragraph. */
function TocDisclosure({ toc }: { toc: readonly TocEntry[] }) {
  return (
    <nav aria-label="On this page" className="mb-10 lg:hidden">
      <details className="group rounded-md border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md px-4 py-3 text-[14.5px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
          On this page
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            aria-hidden="true"
            focusable="false"
            className="shrink-0 text-ink-3 transition-transform duration-150 group-open:rotate-180"
          >
            <path d="M3 5.25 7 9.25l4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <ol className="border-t border-line px-4 py-2">
          {toc.map((entry) => (
            <li key={entry.id}>
              <a href={`#${entry.id}`} className={TOC_LINK}>
                {entry.title}
              </a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}

/** The block of paragraphs and notices above the first section. */
export function DocIntro({ children }: { children: ReactNode }) {
  return <div className="space-y-5">{children}</div>;
}

/** One h2 section. `id` goes on the heading and is what the section list links to. */
export function DocSection({ id, title, children }: TocEntry & { children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-14 first:mt-0">
      <h2
        id={id}
        className="scroll-mt-8 text-[length:clamp(22px,2.4vw,26px)] font-bold leading-[1.2] tracking-[-0.02em]"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** h3 inside a section. */
export function DocH3({ children }: { children: ReactNode }) {
  return <h3 className="pt-3 text-[18px] font-semibold leading-snug tracking-[-0.01em]">{children}</h3>;
}

/** A bulleted list (the old `ul.tight`). */
export function DocList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2.5 pl-5 marker:text-ink-3">{children}</ul>;
}

/** Classes for an inline link in running text; exported for the mailto anchors. */
export const DOC_LINK = "link font-medium text-ink";

/** An in-site link in running text. */
export function DocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={DOC_LINK}>
      {children}
    </Link>
  );
}

/**
 * A link that leaves this origin, in running text: new tab, rel noreferrer noopener, the screen
 * reader note from ExternalLink, and a small ↗ that is not underlined (the old `.ext` arrow).
 */
export function DocExternalLink({
  href,
  srNote = true,
  children,
}: {
  href: string;
  /** false where the sentence already says the link opens a new tab (see ExternalLink). */
  srNote?: boolean;
  children: ReactNode;
}) {
  return (
    <ExternalLink href={href} srNote={srNote} className={DOC_LINK}>
      {children}
      <span aria-hidden="true" className="ml-1 inline-block font-mono text-[0.85em] text-ink-3">
        ↗
      </span>
    </ExternalLink>
  );
}

/** Inline code: a route, a key prefix, a version string. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="num rounded-[6px] bg-surface-2 px-1.5 py-0.5 text-[0.88em] text-ink [overflow-wrap:anywhere]">
      {children}
    </code>
  );
}

/**
 * A boxed notice with the warning triangle (the old `.notice`). `bad` is the perimeter notice (a
 * danger rule on a plain surface); `warn` is a gap the page publishes (warn-soft ground). A <strong>
 * inside renders as its own line, as it did before.
 */
export function Callout({ tone, children }: { tone: "bad" | "warn"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl px-4 py-3.5 text-[15px] leading-[1.6] [&_strong]:mb-0.5 [&_strong]:block",
        tone === "bad" ? "border border-l-[3px] border-line border-l-danger bg-surface" : "bg-warn-soft",
      )}
    >
      <WarnIcon className={cn("mt-[4px] shrink-0", tone === "bad" ? "text-danger" : "text-warn")} />
      <div>{children}</div>
    </div>
  );
}

/** The draft marker's box. The marker's wording stays in each page file, where disclosure policy requires it. Nothing checks it automatically since copy-lint was removed on 2026-09-21. */
export const DRAFT_MARKER = "rounded-xl bg-warn-soft px-4 py-3 text-[15px] leading-[1.6]";
