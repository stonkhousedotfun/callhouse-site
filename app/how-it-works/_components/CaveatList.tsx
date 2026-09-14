import type { ReactNode } from "react";

import { WarnIcon } from "@/components/ui";
import { cn } from "@/lib/cn";

/**
 * The mockup's risks list (.risks / .risk): a warn triangle, a short heading, one paragraph, rows
 * separated by a top rule. Two columns from 960px, one below.
 */
export type Caveat = { title: string; body: ReactNode };

export function CaveatList({
  items,
  headingLevel = 3,
  className,
}: {
  items: Caveat[];
  /** 3 directly under a section's h2; 4 when the list sits under its own h3. */
  headingLevel?: 3 | 4;
  className?: string;
}) {
  const Heading = headingLevel === 4 ? "h4" : "h3";
  return (
    <ul className={cn("grid grid-cols-1 gap-x-14 lg:grid-cols-2", className)}>
      {items.map((item) => (
        <li
          key={item.title}
          className="grid grid-cols-[30px_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-line py-[22px]"
        >
          <WarnIcon size={18} className="mt-[3px] text-warn" />
          <Heading className="text-[17.5px] font-bold tracking-[-0.01em]">{item.title}</Heading>
          <p className="col-start-2 text-[15px] text-ink-2">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}
