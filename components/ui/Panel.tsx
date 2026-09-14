import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * A surface card. Flat by default (1px line border, the mockup's .panel / .ending-panel).
 *
 * `lift` swaps the border for the lift shadow. Reserve it for the few elevated objects the design
 * calls for: the hero week card, the fee slip and key panels. Everything else stays flat.
 *
 * `pad`: none 0 (the slip, which lays out its own rows) · sm 22px (.panel) · md 26px (.weekcard,
 * default) · lg 30px (.ending-panel). Overflow is not clipped unless you add `overflow-hidden`.
 */
export type PanelPad = "none" | "sm" | "md" | "lg";

export type PanelProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  as?: "div" | "article" | "section" | "aside";
  lift?: boolean;
  pad?: PanelPad;
  children: ReactNode;
};

const PAD: Record<PanelPad, string> = {
  none: "",
  sm: "p-[22px]",
  md: "p-[26px]",
  lg: "p-[30px]",
};

export function Panel({ as: Tag = "div", lift = false, pad = "md", className, children, ...rest }: PanelProps) {
  return (
    <Tag
      className={cn(
        "rounded-lg bg-surface",
        lift ? "shadow-lift" : "border border-line",
        PAD[pad],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Alias: the same component, for call sites where "card" reads better. */
export const Card = Panel;
