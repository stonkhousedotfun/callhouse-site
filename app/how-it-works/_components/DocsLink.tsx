import type { ReactNode } from "react";

import { ExternalLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DOCS_URL } from "@/lib/site";

/**
 * Deep links into the GitBook docs (stonkhousedotfun/callhouse-docs). The paths follow GitBook Git Sync's
 * file-path slugs (`product/weekly-cycle.md` is served at `/product/weekly-cycle`). They live in
 * this one map so that if the published slugs ever differ, one edit fixes every link on the page.
 */
export const DOCS = {
  weeklyCycle: `${DOCS_URL}/product/weekly-cycle`,
  policy: `${DOCS_URL}/product/policy`,
  fees: `${DOCS_URL}/product/fees`,
  assignment: `${DOCS_URL}/product/assignment`,
  withdrawing: `${DOCS_URL}/getting-started/withdrawing`,
  depositing: `${DOCS_URL}/getting-started/depositing`,
  claiming: `${DOCS_URL}/getting-started/claiming-usdg`,
  roles: `${DOCS_URL}/protocol/roles`,
  addresses: `${DOCS_URL}/protocol/addresses`,
} as const;

/** A legacy v1 reference link; do not present these pages as current v2 mechanics. */
export function DocsLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <p className={cn("mt-8 text-[15px] text-ink-3", className)}>
      Legacy v1 docs:{" "}
      <ExternalLink href={href} arrow className="link font-semibold text-accent-text">
        {children}
      </ExternalLink>
    </p>
  );
}
