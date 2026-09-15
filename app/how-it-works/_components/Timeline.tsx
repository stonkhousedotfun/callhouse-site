import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * The week as a vertical track: the mockup's numbered step circles and dashed connector, turned
 * on its side because each step here carries a paragraph rather than a line. Below 960px the
 * "when" label sits above the heading; from 960px it gets its own column beside the circle.
 * `accent` steps (where tokens or USDG move) get the accent-filled circle, as in the landing track.
 */
export type TimelineStep = {
  title: string;
  when: ReactNode;
  body: ReactNode;
  note?: ReactNode;
  accent?: boolean;
};

const DASH = "repeating-linear-gradient(180deg, var(--line-2) 0 8px, transparent 8px 14px)";

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="grid">
      {steps.map((step, i) => (
        <li key={step.title} className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-x-[18px] pb-10 last:pb-0">
          {i < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute bottom-0 left-[21px] top-[44px] w-0.5"
              style={{ backgroundImage: DASH }}
            />
          ) : null}
          <span
            aria-hidden="true"
            className={cn(
              "relative grid size-11 place-items-center rounded-full border-2 font-mono text-[15px] font-bold leading-none",
              step.accent ? "border-accent bg-accent text-accent-ink" : "border-line-2 bg-surface text-ink-2",
            )}
          >
            {i + 1}
          </span>
          <div className="grid gap-x-8 gap-y-1.5 pt-1 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:pt-2.5">
            <p className="font-mono text-[12.5px] font-medium leading-[1.35] text-accent-text lg:pt-1">{step.when}</p>
            <div>
              <h3 className="text-[length:clamp(18.5px,1.8vw,21px)] font-bold tracking-[-0.015em]">{step.title}</h3>
              <p className="mt-2 max-w-[44em] text-[15.5px] text-ink-2">{step.body}</p>
              {step.note ? (
                <p className="mt-3 max-w-[44em] rounded-xl bg-surface-2 px-3.5 py-3 text-[14px] leading-[1.5] text-ink-2">
                  {step.note}
                </p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
