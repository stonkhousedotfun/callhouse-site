/**
 * The one place this package knows a URL or an address. Current v2 tickers come from the committed
 * market projection in lib/markets.generated.ts.
 *
 * Two domains, one product: stonkhouse.fun is this package (static marketing, zero wallet code) and
 * app.stonkhouse.fun is @callhouse/web in stonkhousedotfun/callhouse (the dapp). Nothing here is same-origin
 * with the app, so every "go do something" link must be an absolute external URL built with
 * appUrl() — a bare href="/vault/nvda" on this site is a 404 on stonkhouse.fun, not a route into the
 * dapp.
 *
 * The displayed addresses below are DUPLICATED FROM stonkhousedotfun/callhouse: `web/lib/contracts.ts`,
 * `web/lib/chain.ts`. This repo must build, typecheck and deploy with no
 * dependency on the dapp — it is a separate repo and Railway service with its own container, and a
 * shared package would drag viem (and therefore a wallet-shaped dependency tree) into a landing
 * page whose only chain calls are the server's read-only spot fallback (lib/chainPrice.ts). This file DISPLAYS these
 * addresses; it never calls them.
 * If a displayed address changes, this file is updated by hand to match the chain.
 *
 * Deliberately absent: chain clients and ABIs. The landing reads the public, read-only indexer API on the server and,
 * for a missing or stale spot, the market's feed or pool over the public RPC (lib/spotFallback.ts). It renders live
 * values only after validation. The v1 address facts below are historical.
 *
 * LIVE ADDRESSES (confirmed on chain 4663, 2026-09-15): factory.implementation(), factory.clear(),
 * factory.seaport(), factory.usdg(), factory.asset() and factory.priceFeed() return exactly the
 * rows below. hasRole() confirms the three role holders in ROLE_KEYS, and the Clear's feeTo() is
 * ROLE_KEYS.clearFeeTo. The closed pooled vault is not listed here.
 *
 * NO VENUE CONSTANT. Isolated accounts sell through their own Seaport 1.6 1-lot orders, served on
 * the app's book (FILL_PAGE_PATH). Earlier designs listed through a third-party venue and then
 * through a pooled vault; those rows were removed with them.
 */

import { LIVE_MARKETS, REGISTRY_MARKET_COUNT } from "./markets.generated.ts";

export { LIVE_MARKETS, REGISTRY_MARKET_COUNT };

/**
 * THE V8 LAUNCH SET: NVDA and SPCX only. The registry's authoritative `launchSet.markets` block in callhouse
 * `ops/markets/tier1.json` records the same two.
 *
 *
 * HAND-MIRRORED, NOT PROJECTED, and that is a known gap: `lib/markets.generated.ts` carries only `LIVE_MARKETS`
 * and `REGISTRY_MARKET_COUNT` because `scripts/market-projection.mjs` does not render `launchSet` yet. Until the
 * generator projects it, `lib/site.test.ts` pins this list, so drift is red rather than silent. Every sentence about
 * the launch size renders from here. The registry now holds exactly the launch set, so the pages say NVDA and
 * SPCX are the only markets listed; should rows return, they are "not part of the launch", never a number of
 * "deferred" markets, because deferral implies a promise no one has made.
 *
 */
export const LAUNCH_SET = ["NVDA", "SPCX"] as const;

/** "NVDA and SPCX", "A, B and C", "A" — for prose that names the launch set from {LAUNCH_SET}. */
export function listTickers(tickers: readonly string[]): string {
  if (tickers.length === 0) throw new RangeError("listTickers: empty list");
  if (tickers.length === 1) return tickers[0]!;
  return `${tickers.slice(0, -1).join(", ")} and ${tickers[tickers.length - 1]}`;
}

/** The weekdays a registry `dailyWeekdays` list may name (callhouse keeper/src/v2/registry.ts WEEKDAYS), in order. */
const WEEKDAY_NAMES = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday" } as const;
export type Weekday = keyof typeof WEEKDAY_NAMES;
type Listing = { expiriesAhead: { weekly: number; daily: number }; dailyWeekdays: readonly Weekday[] };

/**
 * WHICH EXPIRIES EACH LAUNCH MARKET LISTS: its effective `expiriesAhead` and `dailyWeekdays` in callhouse
 * `ops/markets/tier1.json` (the version scripts/market-projection.mjs pins), `v2.defaults` with the market's
 * `overrides` on top. NVDA lists dailies for Monday, Wednesday and Friday closes only;
 * SPCX lists weeklies and no dailies. Hand-mirrored like LAUNCH_SET, because the
 * projection does not render listing days; lib/site.test.ts compares it with the registry when CALLHOUSE_WEB_DIR is set.
 */
export const LISTED_EXPIRIES = {
  NVDA: { expiriesAhead: { weekly: 0, daily: 6 }, dailyWeekdays: ["mon", "wed", "fri"] },
  SPCX: { expiriesAhead: { weekly: 2, daily: 0 }, dailyWeekdays: ["mon", "tue", "wed", "thu", "fri"] },
} as const satisfies Record<(typeof LAUNCH_SET)[number], Listing>;

/** "NVDA lists daily options expiring Monday, Wednesday and Friday; SPCX lists weekly options only." */
export function listedExpiriesSentence(
  tickers: readonly string[] = LAUNCH_SET,
  listed: Readonly<Record<string, Listing>> = LISTED_EXPIRIES,
): string {
  const parts = tickers.map((ticker) => {
    const listing = listed[ticker];
    if (!listing) throw new RangeError(`listedExpiriesSentence: no listing for ${ticker}`);
    const { expiriesAhead, dailyWeekdays } = listing;
    const days = dailyWeekdays.length === Object.keys(WEEKDAY_NAMES).length
      ? "every trading day"
      : listTickers(dailyWeekdays.map((day) => WEEKDAY_NAMES[day]));
    const daily = expiriesAhead.daily > 0 ? `daily options expiring ${days}` : "";
    if (daily && expiriesAhead.weekly > 0) return `${ticker} lists ${daily} and weekly options`;
    if (daily) return `${ticker} lists ${daily}`;
    if (expiriesAhead.weekly > 0) return `${ticker} lists weekly options only`;
    throw new RangeError(`listedExpiriesSentence: ${ticker} lists no expiries`);
  });
  return `${parts.join("; ")}.`;
}

/** Strip trailing slashes so joins never produce `//`. */
function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** This site. Used for canonical URLs and metadataBase. */
export const SITE_URL = normalizeBase(process.env.NEXT_PUBLIC_SITE_URL ?? "https://stonkhouse.fun");

/** Build-time switch for the separate dev site. Never infer preview mode from the hostname. */
export const DEV_PREVIEW = process.env.NEXT_PUBLIC_DEV_PREVIEW === "1";

/** Product documentation, including the live v2 deployment and labelled legacy v1 material. */
export const DOCS_URL = normalizeBase(process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.stonkhouse.fun");

/** X (Twitter). Override with NEXT_PUBLIC_X_URL if the handle is not @stonkhousefun. */
export const X_URL = normalizeBase(process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/stonkhousefun");

/** Telegram. Override with NEXT_PUBLIC_TELEGRAM_URL if the channel is not t.me/stonkhousefun. */
export const TELEGRAM_URL = normalizeBase(process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "https://t.me/stonkhousefun");

/** App and keeper repo. */
export const GITHUB_URL = normalizeBase(process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/stonkhousedotfun/callhouse");

/** The dapp. Every CTA on this site points into it. */
export const APP_URL = normalizeBase(process.env.NEXT_PUBLIC_APP_URL ?? "https://app.stonkhouse.fun");

/** Explicitly enable dev cards only after the separate app and API are ready. */
export const DEV_CARDS_ENABLED = DEV_PREVIEW && process.env.NEXT_PUBLIC_DEV_CARDS === "1" &&
  SITE_URL === "https://dev.stonkhouse.fun" && APP_URL === "https://dev.app.stonkhouse.fun" &&
  Boolean(process.env.NEXT_PUBLIC_API_URL?.trim());

/**
 * Join a dapp route onto APP_URL. `appUrl("/account")` gives `https://app.stonkhouse.fun/account`,
 * and `appUrl()` gives the bare origin with no trailing slash. An absolute URL is passed through
 * untouched so callers can hand this any href.
 *
 * "Open the app" goes to the app frontpage (`OPEN_APP`). A visitor who is ready to deposit is sent
 * to `VAULT_APP` (`/account`). The two are different pages; do not collapse them.
 */
export function appUrl(path = ""): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  const rest = path.replace(/^\/+/, "");
  return rest ? `${APP_URL}/${rest}` : APP_URL;
}

/** App frontpage. "Open the app" on this site lands here. */
export const OPEN_APP = APP_URL;

/** Deposit collateral and manage positions. */
export const VAULT_APP = appUrl("/account");

/**
 * The historical v1 deployment was NVDA-only. Isolated accounts have no share token;
 * SHARE_TICKER is kept for the closed pooled vault's leftover copy on /terms and /collect.
 * Current v2 availability comes only from the generated LIVE_MARKETS projection above.
 */
export const LEGACY_V1_MARKET = "NVDA";
export const SHARE_TICKER = "cNVDA";

export function marketAvailabilityStatus(markets: readonly string[]): "Live" | "No markets live" {
  return markets.length > 0 ? "Live" : "No markets live";
}

/** Keep the public live/registry count phrased consistently as the generated projection changes. */
export function marketAvailabilitySummary(markets: readonly string[], registryMarketCount: number): string {
  return `${markets.length} of ${registryMarketCount} markets live`;
}

/**
 * Public production status. The contracts first launched on the mainnet dev host and are now the
 * production v2 deployment; the dev hostname is not a separate chain or contract set.
 * The site shows no beta, audit or "Dev preview" label, so the phase and audit strings that
 * used to live here were removed with their last readers.
 */
export const STATUS = {
  v2: marketAvailabilityStatus(LIVE_MARKETS),
} as const;

/**
 * The live v9 fee settings. Read on chain 2026-09-25 6:49 PM PT: OrderBook `feeParams()` =
 * (premiumFeeBps 500, resaleFeeBps 0, takerFeeFlat 100000, takerFeeCapBps 1000, makerRebateBps 5000), and Clearinghouse
 * `market(NVDA|SPCX)` exerciseFeeBps 25, mintFeePpm 0; the same as callhouse ops/markets/tier1.json `v2.fees`. They are
 * not a live read at render time: a scheduled change moves them after its notice, and the app quote and the
 * series-pinned terms control an actual trade.
 */
export const FEES_V2 = {
  premiumBps: 500,
  resalePremiumBps: 0,
  takerFlatRaw: 100_000n,
  takerCapBps: 1_000,
  /** Share of each take's taker fee the book pays the maker whose order filled (MakerRegistry tier 0 = this default). */
  makerRebateBps: 5_000,
  exerciseBps: 25,
  exercisePayoutCapBps: 1_000,
  writerCollateralRatePpm: 0,
  feeChangeDelayHours: 48,
  marketFeeChangeDelayHours: 72,
} as const;

/**
 * Fee figures as prose. /terms, /legal and /how-it-works used to state "5%", "0%" and
 * "72 hours" as hand-typed text beside FEES_V2, and once copy-lint was removed
 * nothing bound the two together — the disclosure matched the constants by coincidence. Every fee
 * figure in prose now renders through these two helpers from FEES_V2, so a constant change moves the prose
 * and lib/site.test.ts pins the constants to the contract values they mirror.
 *
 * `feePct(500)` is "5%", `feePct(0)` is "0%", `feePct(25)` is "0.25%": integer percentages carry no decimals,
 * because that is how the sentences read today and a "5.00%" would be a copy change, not a binding.
 */
export function feePct(bps: number): string {
  if (!Number.isInteger(bps) || bps < 0) throw new RangeError(`feePct: bps must be a non-negative integer, got ${bps}`);
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(2).replace(/0$/, "")}%`;
}

/** `delayHours(72)` is "72 hours"; the possessive apostrophe stays in the sentence that owns it. */
export function delayHours(hours: number): string {
  if (!Number.isInteger(hours) || hours <= 0) throw new RangeError(`delayHours: hours must be a positive integer, got ${hours}`);
  return `${hours} hours`;
}

/** Robinhood Chain mainnet, an Arbitrum Orbit L2. 4663 = 0x1237. */
export const CHAIN_ID = 4663;
export const CHAIN_NAME = "Robinhood Chain";

/**
 * Blockscout is the canonical explorer. Links only: its API sits behind a Cloudflare JS
 * challenge, and in any case nothing on this site fetches anything.
 */
export const EXPLORER_URL = "https://robinhoodchain.blockscout.com";

/**
 * The app route where listed lots are bought and exercised: stonkhousedotfun/callhouse
 * `web/app/book`. The only venue that serves live account orders.
 */
export const FILL_PAGE_PATH = "/book";

export type AddressRow = {
  /** Label as it appears in the addresses table. */
  label: string;
  /** Checksummed, as confirmed on chain 4663. */
  address: string;
  /** One line on what it does, for the table's second column. */
  what: string;
  /** Source-verification status, for the contracts Stonkhouse deployed. Omitted for third parties. */
  verified?: string;
  /** The explorer page that shows this contract's verified source. Present only once the source is verified there. */
  sourceUrl?: string;
};

/**
 * The contracts a week touches. Insertion order is display order. The factory and implementation
 * were deployed on 2026-09-15; the Clear is Stonkhouse's instance of Valorem. The Clear is not
 * source-verified; its runtime equals, outside the trailing CBOR metadata, a Clear that Sourcify
 * verifies against valorem-core 6436c823.
 */
/** StonkHouse token on Robinhood Chain. */
export const TOKEN_ADDRESS = "0xc2525b7c68b6d66dE5AABFEDC7B13314F389D5C4";

/**
 * Public token, USDG and the historical v1 account addresses. Frozen v7 option-contract addresses
 * are intentionally absent from this site. The deployed v9 contracts are in V8_ADDRESSES below.
 */
export const ADDRESSES = {
  token: {
    label: "StonkHouse token",
    address: TOKEN_ADDRESS,
    what: "The STONKHOUSE token (18 decimals) on Robinhood Chain.",
  },
  factory: {
    label: `Stonkhouse ${LEGACY_V1_MARKET} account factory`,
    address: "0xc4A5Cd0DE91CaB7F5Ebe2114bc63Fbb43E642BBb",
    what: `Deploys each user's account. A fill writes that user's ${LEGACY_V1_MARKET} and pays that user.`,
  },
  implementation: {
    label: "Account implementation",
    address: "0xe412A596B000f73ad19B39f51dfd0B17A15F45EC",
    what: "Logic each user account clones.",
  },
  clear: {
    label: "Valorem Clear",
    address: "0x53d7A6d0489Daf3d67b9A314e0eAB2B78Acab9C6",
    what: "Holds collateral of calls sold and settles exercise.",
    verified:
      "Not source-verified yet. Its runtime bytecode matches Valorem's published code at commit 6436c823 except the metadata hash.",
  },
  seaportOrderLib: {
    label: "SeaportOrderLib",
    address: "0x6B617a0B578Ef6EDCD07774468f08b3778272D8A",
    what: "Library from the closed pooled vault. Isolated accounts build their own 1-lot orders.",
    verified: "Verified on Sourcify as a partial match.",
  },
  valoremLib: {
    label: "ValoremLib",
    address: "0xd3CB94893EAb55e425cCd77Db98458b38D75Fa3d",
    what: "Library linked into each account. The list checks, the checks at each fill, and the price-feed read.",
    verified: "Verified on Sourcify as a partial match.",
  },
  seaport: {
    label: "Seaport 1.6",
    address: "0x0000000000000068F116a894984e2DB1123eB395",
    what: "Settles each fill. It asks the seller's account before moving anything, so every fill runs that account's own checks.",
  },
  usdg: {
    label: "USDG",
    address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    what: "6 decimals. Every premium, strike and claim is denominated in it.",
  },
  asset: {
    label: `${LEGACY_V1_MARKET} Stock Token`,
    address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
    what: "18 decimals. The collateral, and a debt security issued by Robinhood Assets (Jersey) Limited.",
  },
  priceFeed: {
    label: "Chainlink RHNVDA / USD",
    address: "0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15",
    what: "8 decimals. Display, and the price floors checked when an account lists and a lot fills. Settlement never reads a price feed.",
  },
} as const satisfies Record<string, AddressRow>;

/**
 * callhouse `ops/markets/tier1.json` `v2.deployBlock`: the block the live core was deployed in. That is the v9 deployment
 * (launched 2026-09-25; its contracts still report interface version 8, which is why the names here keep `V8_`).
 */
export const V8_DEPLOY_BLOCK = 72_462_898;

export const V8_UNVERIFIED = "Not source-verified on the explorer yet.";
export const V8_VERIFIED = "Source verified on the Robinhood Chain explorer.";

/**
 * The explorer that holds verified source: Etherscan's Robinhood Chain explorer. Blockscout above stays the address
 * link.
 */
export const SOURCE_EXPLORER_URL = "https://robin.etherscan.io";

/** The verified-source page for a deployed contract. */
export function verifiedSourceUrl(address: string): string {
  return `${SOURCE_EXPLORER_URL}/address/${address}#code`;
}

/**
 * The deployed v9 contracts. COPIED from the callhouse registry write-back, never typed from a deploy log or a plan:
 * `ops/markets/tier1.json` at the version scripts/market-projection.mjs pins, as written back by the launch run (the
 * registry after externals, RegisterMarkets and the House-vault window of the 2026-09-25 launch run). Each row names
 * the registry key it came from. Etherscan V2 `getsourcecode` (chain 4663) was asked about
 * every row: only the AccessManager returns source. The other eight return none, so they keep V8_UNVERIFIED and no
 * `sourceUrl` until the explorer shows their source. (The v8 set this replaced was verified; none of its
 * addresses is live any more.)
 * Keys are `v8*` so none collides with the removed v7 `v2*` keys lib/site.test.ts keeps out.
 */
export const V8_ADDRESSES = {
  // v2.contracts.clearinghouse
  v8Clearinghouse: {
    label: "Clearinghouse",
    address: "0xD33663CD8A363710daF87C78616899cED34b9374",
    what: "Holds writer collateral, mints the long and short tokens of each series and pays holders at settlement.",
    verified: V8_UNVERIFIED,
  },
  // v2.contracts.orderBook
  v8OrderBook: {
    label: "OrderBook",
    address: "0x581AFCC6Da498F4D8161705E1D294a6e4fEeaeF3",
    what: "Bids, resale asks and write-on-fill asks for every series. Every take pays the taker fee.",
    verified: V8_UNVERIFIED,
  },
  // v2.contracts.settlementOracle
  v8SettlementOracle: {
    label: "SettlementOracle",
    address: "0x932c9BF2350633382ed6b2CB52e1c82345A3B160",
    what: "One settlement price per stock and expiry, from that market's registered price sources.",
    verified: V8_UNVERIFIED,
  },
  // v2.contracts.expiryCalendar
  v8ExpiryCalendar: {
    label: "ExpiryCalendar",
    address: "0x7ae41B8b0ba2189CC59a9c124b20D9BA00177ae5",
    what: "The expiry grid: 16:00 New York time on NYSE session days, plus whitelisted special expiries.",
    verified: V8_UNVERIFIED,
  },
  // v2.contracts.payoutAdapter
  v8PayoutAdapter: {
    label: "PayoutAdapter",
    address: "0x92E01EbED9A3253a7D029912546C594bD3DD2737",
    // The PayoutRouter. registry markets[].v2.payoutRoute is {venue: v3, fee: 500} for NVDA and SPCX, and
    // routes(asset) on chain (2026-09-25 6:50 PM PT) answers Venue.V3, fee 500, the same pools the oracle reads.
    what: "Sells an in-the-money call's Stock Token payout for USDG through the PayoutRouter, on each market's pinned route (for NVDA and SPCX, a Uniswap v3 pool with a 0.05% fee). If the sale fails, the payout is paid in Stock Tokens.",
    verified: V8_UNVERIFIED,
  },
  // markets[ticker=NVDA].v2.houseVault (equal to v2.contracts.houseVault)
  v8HouseVaultNvda: {
    label: "NVDA house vault",
    address: "0xF9F95d999aA798fc0B60a0f85f7CCe251fe247a7",
    what: "User-funded market maker for NVDA. Depositors hold its shares; a bot quotes inside on-chain limits.",
    verified: V8_UNVERIFIED,
  },
  // markets[ticker=SPCX].v2.houseVault
  v8HouseVaultSpcx: {
    label: "SPCX house vault",
    address: "0x031AB8C376C31447e766Fb95d19D2369f3806Ce1",
    what: "User-funded market maker for SPCX. Depositors hold its shares; a bot quotes inside on-chain limits.",
    verified: V8_UNVERIFIED,
  },
  // v2.contracts.earnVault
  v8EarnVault: {
    label: "Earn vault",
    address: "0x847794900FAE91516Cc3fbc36955C6B64a2dD609",
    what: "Earn. Depositors receive shares; the vault writes calls by resting asks on the OrderBook.",
    verified: V8_UNVERIFIED,
  },
  // v2.contracts.accessManager
  v8AccessManager: {
    label: "AccessManager",
    address: "0x3698FDcD6A29675382d287b30546B75dE9174103",
    what: "Maps each admin function to a role, with delays on scheduled changes.",
    verified: V8_VERIFIED,
    sourceUrl: verifiedSourceUrl("0x3698FDcD6A29675382d287b30546B75dE9174103"),
  },
} as const satisfies Record<string, AddressRow>;

/**
 * Who holds the keys, as read on chain 2026-09-15 (factory hasRole; Clear feeTo; Safe getOwners and
 * getThreshold). The admin is also the factory's feeRecipient(). The Clear's fee address is a Safe
 * v1.4.1 with one owner and threshold 1.
 */
export const ROLE_KEYS = {
  admin: "0xEb82c3D0F89d47453F94f0C2b2a2752e27a19d9b",
  keeper: "0x06c131cfEd73A56893f5eB52D17252856FAFC1d2",
  guardian: "0x29741A8d283a253E8Ce10aDfd04C6507438b6F39",
  clearFeeTo: "0xff1454009F024507f3E455eb2027E98fAF4ccF61",
} as const;

/** Same rows, ordered, for rendering a table without Object.values() at the call site. */
export const ADDRESS_ROWS: readonly AddressRow[] = Object.values(ADDRESSES);

/** Explorer link for one of the addresses above. */
export function addressUrl(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}
