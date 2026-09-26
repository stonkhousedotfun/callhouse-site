"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/cn";
import { marketAt, viewerAt } from "@/lib/clock";

/**
 * An instant in the reader's time zone, zone named. The server cannot know that zone, so the server render and the
 * hydration pass both use New York time, named (the server snapshot); React then re-renders with the browser's zone
 * right after hydrating, so there is no mismatch and no unnamed time. With `market`, a deadline also keeps New York
 * time beside it: "Sep 24, 1:00 PM PDT (4:00 PM ET)".
 */

/** The browser's zone does not change under a page, so there is nothing to subscribe to. */
function subscribe(): () => void {
  return () => {};
}
export function LocalTime({
  at,
  market = false,
  dateless = false,
  className,
}: {
  /** Unix seconds. */
  at: number;
  market?: boolean;
  dateless?: boolean;
  className?: string;
}) {
  const text = useSyncExternalStore(
    subscribe,
    () => viewerAt(at, { market, dateless }),
    () => marketAt(at, dateless),
  );
  return (
    <time dateTime={new Date(at * 1000).toISOString()} className={cn("num", className)}>
      {text}
    </time>
  );
}
