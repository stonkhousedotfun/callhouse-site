import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * A moment on the week's clock. New York is the line a reader should remember; UTC sits
 * underneath in muted type so the two clocks cannot be scanned as one run-on time.
 */
export function When({
  children,
  utc,
  className,
}: {
  children: ReactNode;
  utc?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("num leading-[1.35]", className)}>
      {children}
      {utc ? <span className="mt-0.5 block text-[0.85em] font-medium text-ink-3">{utc}</span> : null}
    </span>
  );
}

/** One-line DST / holiday footnote. Use once per page, not inside every deadline. */
export function ClockNote({ className }: { className?: string }) {
  return (
    <p className={cn("max-w-[44em] text-[13.5px] leading-[1.5] text-ink-3", className)}>
      Times are New York. The Friday close is <span className="num">8:00pm UTC</span> during US daylight time and{" "}
      <span className="num">9:00pm UTC</span> after it ends. A Friday NYSE holiday moves the close to Thursday.
    </p>
  );
}
