/**
 * The landing hero's product snapshot: the facts, once. Status chips and the audit line live
 * in the hero; this card does not repeat them.
 */
import { Figure, Panel } from "@/components/ui";
import { fmtPct } from "@/lib/format";
import { MARKET, SHARE_TICKER } from "@/lib/site";

export function StatusCard() {
  return (
    <Panel as="article" lift aria-labelledby="status-card-h" className="grid gap-6">
      <div>
        <h2 id="status-card-h" className="text-lg font-bold tracking-[-0.01em]">
          Stonkhouse today
        </h2>
        <p className="text-[13.5px] text-ink-3">Policy as of launch. Not this week&apos;s live book.</p>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Figure boxed size="lg" label="First stock" value={MARKET} />
        <Figure boxed size="lg" label="You get paid in" value="USDG" />
        <Figure boxed size="md" label="Our fee" value={`${fmtPct(5)} of what you earn`} />
        <Figure boxed size="md" label="Cap" value="20" unit={MARKET} />
      </dl>
    </Panel>
  );
}
