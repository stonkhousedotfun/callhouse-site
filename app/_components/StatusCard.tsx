/**
 * The landing hero's product snapshot: who we are right now, not this week's call.
 *
 * NVDA is the first vault, not the only vault the product is built for. Status and audit are
 * the same strings as lib/site.ts STATUS, so the card cannot disagree with the footer.
 */
import { Chip, Figure, Panel } from "@/components/ui";
import { fmtPct } from "@/lib/format";
import { CHAIN_NAME, MARKET, SHARE_TICKER, STATUS } from "@/lib/site";

export function StatusCard() {
  return (
    <Panel as="article" lift aria-labelledby="status-card-h" className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="status-card-h" className="text-lg font-bold tracking-[-0.01em]">
            Stonkhouse today
          </h2>
          <p className="text-[13.5px] text-ink-3">
            One vault at launch, more stocks to follow
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="accent" dot>
            {STATUS.phase}
          </Chip>
          <Chip tone="warn">{STATUS.audit}</Chip>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Figure boxed size="lg" label="First vault" value={MARKET} />
        <Figure boxed size="lg" label="You receive" value={SHARE_TICKER} />
        <Figure boxed size="md" label="Chain" value={CHAIN_NAME} mono={false} />
        <Figure boxed size="md" label="Protocol fee" value={`${fmtPct(5)} of premium`} />
        <Figure boxed size="md" label="Launch cap" value="20" unit={MARKET} />
        <Figure boxed size="md" label="More vaults" value="After NVDA" mono={false} />
      </dl>

      <p className="border-t border-line pt-4 text-[13.5px] text-ink-3">
        {STATUS.auditLine} The {MARKET} cap is sized to that. This card is not live vault data.
      </p>
    </Panel>
  );
}
