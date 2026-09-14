"use client";

/**
 * The landing's "Three endings" tabs: the only interactive island on the home page.
 *
 * The first ending ("Nobody bought") is the initial state, so it is what the server renders and
 * what a reader without JavaScript sees. It goes first on purpose: on a thin book it is the most
 * likely week, and it is the one a skimmer is most likely to get wrong (an unfilled week can
 * still be assigned, because Valorem spreads exercise across every writer of the series).
 *
 * The copy lives in this file, inside the repo, so scripts/copy-lint.mjs scans it. Every sentence
 * is checked against leekzor/callhouse-docs: getting-started/how-it-works.md ("How a week can
 * end"), product/assignment.md and product/fees.md. Keep it that way when editing.
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
    body: "The listing sat on the book and no buyer filled it, so there is no premium and no fee. The NVDA comes back at the close, except anything Valorem assigned: the vault writes the same series as other writers, and if their buyers exercise, part of that exercise can land on the vault.",
    premium: "None",
    nvda: "Back at close, unless assigned",
    upside: "Kept, unless assigned",
  },
  {
    key: "otm",
    title: "Bought, expired worthless",
    hint: "Usually: NVDA stayed under the strike",
    body: "Buyers paid for some or all of the calls and no exercise was assigned to the vault, usually because NVDA stayed under the strike. Premium, less Overcall's 5% and Callhouse's 5%, is credited to depositors in USDG, and the NVDA comes back at the close.",
    premium: "Kept, net of fees",
    nvda: "Back at close",
    upside: "Kept",
  },
  {
    key: "itm",
    title: "Bought and exercised",
    hint: "Usually: NVDA ran past the strike",
    body: "Holders exercised, usually because NVDA ran past the strike, and Valorem assigned some or all of the vault's contracts. Exercise alone does not decide that: Valorem chooses how many of the vault's contracts to assign, anywhere from none to all. Premium is still credited. Assigned NVDA leaves the vault at the strike and comes back as strike USDG, credited to depositors in full with no fee. The gain above the strike on the assigned NVDA is given up for that week, and v1 does not buy the NVDA back.",
    premium: "Kept, net of fees",
    nvda: "Assigned part leaves at the strike, paid in USDG",
    upside: "Given up that week",
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
