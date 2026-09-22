/**
 * Building blocks for /risks, local to the route. Server components, no client runtime.
 *
 * Every risk on the page is one `Risk` record, and both the "At a glance" strip and the detailed
 * entries render from the same records, so the summary can never list a risk the detail omits or
 * label it differently.
 *
 * Two labels per risk, and neither is a number:
 *   - `often`  how often to expect it, as an ordering ("Most weeks", "Rare"). Never a percentage:
 *              a probability would be a model this project does not have.
 *   - `impact` the worst it can cost a depositor, one of five kinds. The chip carries words, so the
 *              colour is never the only signal. Every entry that uses a kind must make that kind's
 *              legend line true: "premium" says the NVDA is not at stake, so an entry whose worst
 *              case takes NVDA (the Valorem engine fee, paid in NVDA at every write, and under write on
 *              fill every write is a sale) is "nvda-fee".
 *
 * The danger chip is built here rather than in components/ui: the shared Chip has no danger tone,
 * and this is the only page that needs one.
 */
import type { ReactNode } from "react";

import { Panel, WarnIcon } from "@/components/ui";
import { cn } from "@/lib/cn";

export type Impact = "premium" | "buyer-cost" | "nvda-fee" | "exit" | "upside" | "total";

type ImpactStyle = {
  /** Chip text. Short enough to sit beside a title at 390px. */
  label: string;
  /** One line for the legend. */
  meaning: string;
  chip: string;
  /** Colour of the entry's warning icon and of its "What it costs you" label. */
  tone: string;
};

export const IMPACT: Record<Impact, ImpactStyle> = {
  "buyer-cost": {
    label: "Full cost",
    meaning: "A buyer can lose the entire premium and taker fee paid for a contract.",
    chip: "bg-warn-soft text-warn",
    tone: "text-warn",
  },
  premium: {
    label: "Premium",
    meaning: "Costs a week's premium, or time. The NVDA itself is not what is at stake.",
    chip: "bg-surface-2 text-ink-2",
    tone: "text-warn",
  },
  "nvda-fee": {
    label: "Some NVDA",
    meaning: "Can take a slice of the NVDA itself on every call sold, as well as weeks of premium.",
    chip: "bg-warn-soft text-warn",
    tone: "text-warn",
  },
  exit: {
    label: "Exit timing",
    meaning: "Delays when you can leave, and changes what you leave with.",
    chip: "bg-warn-soft text-warn",
    tone: "text-warn",
  },
  upside: {
    label: "Upside",
    meaning: "Can cost the gain above the strike, and NVDA sold at the strike for USDG.",
    chip: "bg-warn-soft text-warn",
    tone: "text-warn",
  },
  total: {
    label: "Can be total",
    meaning: "Can cost what you deposited.",
    chip: "bg-danger/10 text-danger",
    tone: "text-danger",
  },
};

/** Legend order: least to most severe. */
export const IMPACT_ORDER: readonly Impact[] = ["premium", "buyer-cost", "nvda-fee", "exit", "upside", "total"];

export type Risk = {
  /** Anchor id. Stable: other pages and the docs may link to /risks#<id>. */
  id: string;
  title: string;
  often: string;
  impact: Impact;
  /** What the failure is. One or more <p>. */
  body: ReactNode;
  /** Optional block between the body and the cost (a table-like list, for instance). */
  extra?: ReactNode;
  cost: ReactNode;
  /** Last on purpose: the honest answer is sometimes "nothing", and it reads after the cost. */
  response: ReactNode;
};

export type RiskGroup = {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  risks: readonly Risk[];
};

export function ImpactChip({ impact, className }: { impact: Impact; className?: string }) {
  const style = IMPACT[impact];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[7px] whitespace-nowrap rounded-full px-2.5 py-1.5 font-body text-[12.5px] font-semibold leading-none",
        style.chip,
        className,
      )}
    >
      <span aria-hidden="true" className="size-[7px] shrink-0 rounded-full bg-current" />
      {style.label}
    </span>
  );
}

const LABEL = "text-[12.5px] font-bold uppercase leading-none tracking-[0.08em]";

/** One detailed entry: the mockup's risk row, grown into a two-column record. */
export function RiskEntry({ risk }: { risk: Risk }) {
  const style = IMPACT[risk.impact];
  return (
    <article
      id={risk.id}
      aria-labelledby={`${risk.id}-h`}
      className="grid scroll-mt-6 grid-cols-1 gap-x-12 gap-y-5 border-t border-line py-9 first:border-t-0 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]"
    >
      <div>
        <h3
          id={`${risk.id}-h`}
          className="flex items-start gap-3 text-[21px] font-bold leading-[1.2] tracking-[-0.015em]"
        >
          <WarnIcon size={18} className={cn("mt-[3px] shrink-0", style.tone)} />
          <span>{risk.title}</span>
        </h3>
        <dl className="mt-4 grid gap-2.5 pl-[30px] text-[13.5px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <dt className="w-[5.75rem] text-ink-3">How often</dt>
            <dd className="font-semibold text-ink">{risk.often}</dd>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <dt className="w-[5.75rem] text-ink-3">Worst case</dt>
            <dd>
              <ImpactChip impact={risk.impact} />
            </dd>
          </div>
        </dl>
      </div>

      <div className="min-w-0">
        <div className="grid max-w-[44em] gap-3.5 text-ink-2">{risk.body}</div>
        {risk.extra}
        <dl className="mt-6 grid max-w-[44em] gap-3">
          <div className="rounded-md bg-surface-2 px-4 py-4 sm:px-5">
            <dt className={cn(LABEL, style.tone)}>What it costs you</dt>
            <dd className="mt-2 grid gap-2.5 text-[15px] text-ink">{risk.cost}</dd>
          </div>
          <div className="rounded-md border border-line px-4 py-4 sm:px-5">
            <dt className={cn(LABEL, "text-ink-3")}>What the system does</dt>
            <dd className="mt-2 grid gap-2.5 text-[15px] text-ink-2">{risk.response}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

/** One tile of the "At a glance" strip: the group's risks as links to their entries. */
export function GlanceGroup({ group }: { group: RiskGroup }) {
  const headingId = `glance-${group.id}`;
  return (
    <Panel as="section" pad="sm" aria-labelledby={headingId}>
      <h3 id={headingId} className="text-[17px] font-bold tracking-[-0.01em]">
        <a href={`#${group.id}`} className="rounded-sm no-underline hover:text-accent-text">
          {group.eyebrow}
        </a>
      </h3>
      <ul className="mt-2">
        {group.risks.map((risk) => (
          <li key={risk.id} className="border-t border-line first:border-t-0">
            <a
              href={`#${risk.id}`}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 rounded-sm py-3 no-underline"
            >
              <span>
                <span className="block font-semibold leading-snug text-ink underline decoration-transparent decoration-1 underline-offset-[3px] transition-colors duration-150 group-hover:decoration-line-2">
                  {risk.title}
                </span>
                <span className="mt-0.5 block text-[13px] text-ink-3">{risk.often}</span>
              </span>
              <ImpactChip impact={risk.impact} />
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** The legend tile that completes the glance grid. */
export function ImpactLegend() {
  return (
    <section aria-labelledby="glance-legend" className="rounded-lg bg-surface-2 p-[22px]">
      <h3 id="glance-legend" className="text-[17px] font-bold tracking-[-0.01em]">
        Reading the chips
      </h3>
      <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-3.5">
        {IMPACT_ORDER.map((impact) => (
          <div key={impact} className="contents">
            <dt>
              <ImpactChip impact={impact} />
            </dt>
            <dd className="text-[14.5px] text-ink-2">{IMPACT[impact].meaning}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 border-t border-line-2 pt-4 text-[13.5px] text-ink-3">
        The chip is the worst case, not the usual one. &quot;How often&quot; is an ordering, never a
        probability.
      </p>
    </section>
  );
}
