import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * A moment on the week's clock. Pass it a <LocalTime> so the reader sees their own zone, named.
 */
export function When({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("num leading-[1.35]", className)}>{children}</span>;
}

/** One-line time note. Use once per page, not inside every deadline. */
export function ClockNote({ className }: { className?: string }) {
  return (
    <p className={cn("max-w-[44em] text-[13.5px] leading-[1.5] text-ink-3", className)}>
      Times are shown in your time zone; the market closes at <span className="num">4:00 PM ET</span>.
    </p>
  );
}
