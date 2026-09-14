import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import { WarnIcon } from "./icons";

/**
 * A warning line with the triangle icon.
 *   - box   (default): warn-soft background, rounded (the mockup's .note).
 *   - plain: no background, icon in warn colour beside running text (the hero's .disclose).
 *
 * Copy that copy-lint requires on a page (e.g. "Premium is paid only if a buyer fills" on
 * app/page.tsx) must be written in that page file as children, never as a default inside this
 * component: the linter reads the page file's source text.
 */
export type NoticeProps = {
  variant?: "box" | "plain";
  as?: "p" | "div";
  className?: string;
  children: ReactNode;
};

export function Notice({ variant = "box", as: Tag = "p", className, children }: NoticeProps) {
  const box = variant === "box";
  return (
    <Tag
      className={cn(
        "flex items-start gap-2.5 text-ink-2",
        box ? "rounded-xl bg-warn-soft px-3.5 py-3 text-[13.5px] leading-[1.45]" : "max-w-[36em] text-sm",
        className,
      )}
    >
      <WarnIcon className={cn("shrink-0 text-warn", box ? "mt-px" : "mt-[3px]")} />
      {Tag === "p" ? <span>{children}</span> : <div>{children}</div>}
    </Tag>
  );
}
