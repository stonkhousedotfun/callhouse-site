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
 * `web/lib/chain.ts` and `README.md` ON PURPOSE. This repo must build, typecheck and deploy with no
 * dependency on the dapp — it is a separate repo and Railway service with its own container, and a
 * shared package would drag viem (and therefore a wallet-shaped dependency tree) into a landing
 * page that makes no chain calls at all. This file DISPLAYS these addresses; it never calls them.
 * If a displayed address changes, this file is updated by hand to match the chain.
 *
 * Deliberately absent: chain clients and ABIs. The v2 landing may read the public, read-only
 * indexer API on the server. It renders live values only after validation and otherwise uses a
 * labelled example. The v1 address facts below remain historical until the migration is complete.
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
 * THE V8 LAUNCH SET. Owner ruling 2026-09-21 ("launch with NVDA and SPCX only"), recorded as the
 * registry's authoritative `launchSet.markets` block in callhouse `ops/markets/tier1.json`
 * (`e09af8aaed8e1f9a29aaf82f010c652ee1085050`). T-OP-105.
 *
 * HAND-MIRRORED, NOT PROJECTED, and that is a known gap: `lib/markets.generated.ts` carries only `LIVE_MARKETS`
 * and `REGISTRY_MARKET_COUNT` because `scripts/market-projection.mjs` does not render `launchSet` yet, and both
 * files sit outside the row that added this constant. Until the generator projects it, `lib/site.test.ts` pins
 * this list to the ruling and the registry SHA above, so drift is red rather than silent. Every sentence about
 * the launch size renders from here; the 33 other registry rows are "not part of the launch", never a number
 * of "deferred" markets, because deferral implies a promise the ruling does not make.
 */
export const LAUNCH_SET = ["NVDA", "SPCX"] as const;

/** "NVDA and SPCX", "A, B and C", "A" — for prose that names the launch set from {LAUNCH_SET}. */
export function listTickers(tickers: readonly string[]): string {
  if (tickers.length === 0) throw new RangeError("listTickers: empty list");
  if (tickers.length === 1) return tickers[0]!;
  return `${tickers.slice(0, -1).join(", ")} and ${tickers[tickers.length - 1]}`;
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
 * production v2 deployment; the dev hostname is not a separate chain or contract set. The landing,
 * footer and risks glance read these so "beta" and the audit fact cannot drift across pages. An
 * external audit is pending; no external audit report has been published yet.
 */
export const STATUS = {
  phase: "Beta",
  audit: "Unaudited",
  auditLine: "No external audit report has been published. An external audit is pending.",
  v2: marketAvailabilityStatus(LIVE_MARKETS),
} as const;

/**
 * Pre-broadcast settings for the replacement contracts. They are design values, not a live read;
 * the app quote and series-pinned terms control an actual trade after those contracts are active.
 */
export const FEES_V2 = {
  premiumBps: 500,
  resalePremiumBps: 0,
  takerFlatRaw: 100_000n,
  takerCapBps: 1_000,
  exerciseBps: 25,
  exercisePayoutCapBps: 1_000,
  writerCollateralRatePpm: 0,
  feeChangeDelayHours: 48,
  marketFeeChangeDelayHours: 72,
} as const;

/**
 * Fee figures as prose. T-OP-091 (F-SITE-02): /terms, /legal and /how-it-works used to state "5%", "0%" and
 * "72 hours" as hand-typed text beside FEES_V2, and once copy-lint was removed (owner instruction 2026-09-21,
 * 18ad2eec) nothing bound the two together — the disclosure matched the constants by coincidence. Every fee
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
 * Public token and historical v1 account addresses. Frozen v7 option-contract addresses are
 * intentionally absent from this site. V8 addresses stay unpublished until deployment.
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
