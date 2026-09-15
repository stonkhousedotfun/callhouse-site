"use client";

/**
 * The landing's "How a week ends" tabs: the only interactive island on the home page.
 *
 * The first ending ("Nobody bought") is the initial state, so it is what the server renders and
 * what a reader without JavaScript sees. It goes first on purpose: on a thin book it is the most
 * likely week. Under write on fill (leekzor/callhouse-contracts src/Vault.sol authorizeOrder,
 * validateOrder) it is also the simplest: nothing is written unless a buyer fills, so an unfilled
 * week has nothing to assign (rollClose skips the redeem when claimKey == 0).
 *
 * The fourth tab is not an ending of its own but the close being held up: a stranded claim
 * (src/Vault.sol rollClose, retryStrandedClaim, isStranded; docs/ACCOUNTING.md §5).
 *
 * Example figures are from the keeper's fork rehearsal (keeper/run-final/report.md): week 1 offered
 * 23 calls and harvested 0; week 2 had 2 of 5 sold calls exercised at 223 (usdgFromAssignment
 * 446000000); week 3 stranded under a USDG freeze of the vault and the retry returned 1e18 NVDA and
 * 239000000 USDG. Each is labelled as a rehearsal where it appears.
 *
 * The copy lives in this file, inside the repo, so scripts/copy-lint.mjs scans it. Every sentence
 * is checked against the contracts first and leekzor/callhouse-docs second. Keep it that way when
 * editing.
 *
 * ARIA tabs pattern with automatic activation: one tab stop for the list (roving tabindex),
 * arrow keys in either axis, Home and End.
 */
import { useId, useRef, useState, type KeyboardEvent } from "react";

import { Figure } from "@/components/ui/Figure";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/cn";

type Ending = {
  key: string;
  title: string;
  hint: string;
  body: string;
  premium: string;
  nvda: string;
  upside: string;
};

const ENDINGS: readonly Ending[] = [
  {
    key: "none",
    title: "Nobody bought",
    hint: "The most likely week on a thin book",
    body: "The listing stayed open until the Friday close and no buyer filled it. Calls are written only when bought, so nothing was written: no premium, no fee, nothing that can be assigned, and the NVDA never left the vault. In the fork rehearsal's first week, 23 calls were offered and the week closed with 0 USDG.",
    premium: "None",
    nvda: "Never left the vault",
    upside: "Kept",
  },
  {
    key: "otm",
    title: "Bought, expired worthless",
    hint: "Usually: NVDA stayed under the strike",
    body: "Buyers paid for some or all of the calls on offer, each fill wrote exactly the calls it bought, and none was exercised against the vault, usually because NVDA stayed under the strike. Premium, less Callhouse's 5%, is credited to depositors in USDG, and the NVDA behind the calls comes back at the close.",
    premium: "Kept, net of the fee",
    nvda: "Back at close",
    upside: "Kept",
  },
  {
    key: "itm",
    title: "Bought and exercised",
    hint: "Usually: NVDA ran past the strike",
    body: "Holders exercised, usually because NVDA ran past the strike, and Valorem assigned some or all of the vault's contracts. Valorem spreads exercise across everyone who wrote the same call, so the vault can be assigned on part of what it sold, but never on more than it sold. Premium is still credited. Assigned NVDA leaves the vault at the strike and comes back as strike USDG, credited to depositors in full with no fee. The gain above the strike on the assigned NVDA is given up for that week, and v1 does not buy the NVDA back. In the rehearsal's second week, 2 of the 5 calls sold were exercised at 223, and 446 USDG came back fee-free.",
    premium: "Kept, net of the fee",
    nvda: "Assigned part leaves at the strike, paid in USDG",
    upside: "Given up that week",
  },
  {
    key: "stranded",
    title: "Closed, claim stranded",
    hint: "Rare: a token issuer blocks the close",
    body: "Closing the week asks Valorem to hand back the vault's claim. If USDG is paused, the vault or Valorem is frozen on USDG, or the vault is blocklisted on the Stock Token in a week not fully assigned, that fails. The week closes anyway and the claim is kept: deposits, instant withdrawals and the next week stay shut, queued withdrawals settle their share of the idle NVDA at once and take their share of the claim when it clears, and anyone can retry. It clears only when the issuer lets it. In the rehearsal a USDG freeze of the vault stranded week 3; after the unfreeze the retry brought back 1 NVDA and 239 USDG.",
    premium: "Credited; USDG claims wait on USDG",
    nvda: "Held in the claim until a retry succeeds",
    upside: "As the week ended",
  },
];

export function EndingsTabs() {
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const base = useId();
  const tabId = (i: number) => `${base}-tab-${ENDINGS[i].key}`;
  const panelId = `${base}-panel`;
  const ending = ENDINGS[active];

  function select(i: number) {
    const next = (i + ENDINGS.length) % ENDINGS.length;
    setActive(next);
    tabs.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, i: number) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        select(i + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        select(i - 1);
        break;
      case "Home":
        select(0);
        break;
      case "End":
        select(ENDINGS.length - 1);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
      <div role="tablist" aria-label="Week endings" aria-orientation="vertical" className="grid gap-2.5">
        {ENDINGS.map((e, i) => {
          const selected = i === active;
          return (
            <button
              key={e.key}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              id={tabId(i)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(event) => onKeyDown(event, i)}
              className={cn(
                "grid cursor-pointer gap-1 rounded-md border px-[18px] py-4 text-left transition-[background-color,border-color,box-shadow] duration-150",
                selected ? "border-transparent bg-surface shadow-soft" : "border-line-2 bg-transparent hover:bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "font-display text-lg font-bold tracking-[-0.01em]",
                  selected ? "text-accent-text" : "text-ink",
                )}
              >
                {e.title}
              </span>
              <span className="text-sm text-ink-3">{e.hint}</span>
            </button>
          );
        })}
      </div>

      <Panel
        pad="lg"
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(active)}
        tabIndex={0}
        className="grid gap-[22px] focus-visible:outline-offset-[-2px]"
      >
        <h3 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em]">{ending.title}</h3>
        <p className="max-w-[40em] text-[16.5px] text-ink-2">{ending.body}</p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Figure boxed caps mono={false} size="sm" label="Premium" value={ending.premium} />
          <Figure boxed caps mono={false} size="sm" label="Your NVDA" value={ending.nvda} />
          <Figure boxed caps mono={false} size="sm" label="Upside" value={ending.upside} />
        </dl>
      </Panel>
    </div>
  );
}
