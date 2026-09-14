import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * One data set, two layouts. From the breakpoint up it is a real <table> on a flat surface panel;
 * below it, the same rows become stacked cards with each cell labelled, so a 390px reader never
 * scrolls a table sideways to finish a sentence. The hidden layout is display:none, so assistive
 * tech only ever meets one copy.
 *
 * The first column is the row's name (a <th scope="row"> in the table, the card title below).
 */
export type RuleColumn = { key: string; label: string };
export type RuleRow = { id: string; cells: Record<string, ReactNode> };

export function RuleTable({
  caption,
  columns,
  rows,
  breakpoint = "lg",
  firstColWidth,
  className,
}: {
  caption: string;
  columns: RuleColumn[];
  rows: RuleRow[];
  /** Where the table layout takes over from the cards. */
  breakpoint?: "sm" | "lg";
  /** Tailwind width class for the first column, e.g. "w-[22%]". */
  firstColWidth?: string;
  className?: string;
}) {
  const [head, ...rest] = columns;
  const lg = breakpoint === "lg";

  return (
    <div className={className}>
      <div className={cn("hidden rounded-lg border border-line bg-surface px-[22px] py-2", lg ? "lg:block" : "sm:block")}>
        <table className="w-full border-collapse text-left text-[15px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "border-b border-line px-3 py-3 align-bottom text-[12.5px] font-semibold uppercase leading-tight tracking-[0.06em] text-ink-3",
                    i === 0 ? cn("pl-0", firstColWidth) : null,
                    i === columns.length - 1 ? "pr-0" : null,
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row.id}>
                <th
                  scope="row"
                  className={cn(
                    "py-3.5 pl-0 pr-3 align-top font-semibold text-ink",
                    r < rows.length - 1 ? "border-b border-line" : null,
                  )}
                >
                  {row.cells[head.key]}
                </th>
                {rest.map((c, i) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-3 py-3.5 align-top text-ink-2",
                      i === rest.length - 1 ? "pr-0" : null,
                      r < rows.length - 1 ? "border-b border-line" : null,
                    )}
                  >
                    {row.cells[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label={caption} className={cn("grid gap-3", lg ? "lg:hidden" : "sm:hidden")}>
        {rows.map((row) => (
          <li key={row.id} className="rounded-md border border-line bg-surface p-4">
            <p className="font-display text-[17px] font-bold tracking-[-0.01em] text-ink">{row.cells[head.key]}</p>
            <dl className="mt-3 grid gap-2.5">
              {rest.map((c) => (
                <div key={c.key} className="grid gap-0.5">
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">{c.label}</dt>
                  <dd className="text-[15px] text-ink-2">{row.cells[c.key]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
