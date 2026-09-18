/**
 * The landing hero's product snapshot: the facts, once. Status chips and the audit line live
 * in the hero; this card does not repeat them.
 */
import { ExternalLink, Figure, Panel } from "@/components/ui";
import { MARKET, TOKEN_ADDRESS, addressUrl } from "@/lib/site";

export function StatusCard() {
  return (
    <Panel as="article" lift aria-labelledby="status-card-h" className="grid gap-6">
      <div>
        <h2 id="status-card-h" className="text-lg font-bold tracking-[-0.01em]">
          Stonkhouse today
        </h2>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Figure boxed size="lg" label="First stock" value={MARKET} />
        <Figure boxed size="lg" label="You get paid in" value="USDG" />
        <Figure boxed size="md" label="v2 writer rent" value="Varies" />
      </dl>
      <p className="text-sm text-ink-2">Planned v2 fee: rent on collateral when an option is minted. The market rate and remaining life set the amount.</p>

      <div>
        <p className="text-[13px] font-medium text-ink-3">Contract</p>
        <ExternalLink
          href={addressUrl(TOKEN_ADDRESS)}
          className="num mt-1.5 block break-all text-[13.5px] leading-snug text-ink no-underline hover:text-accent-text"
        >
          {TOKEN_ADDRESS}
        </ExternalLink>
      </div>
    </Panel>
  );
}
