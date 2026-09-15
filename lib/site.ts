/**
 * The one place this package knows a URL, a ticker or an address.
 *
 * Two domains, one product: stonkhouse.fun is this package (static marketing, zero wallet code) and
 * app.stonkhouse.fun is @callhouse/web in leekzor/callhouse (the dapp). Nothing here is same-origin
 * with the app, so every "go do something" link must be an absolute external URL built with
 * appUrl() — a bare href="/vault/nvda" on this site is a 404 on stonkhouse.fun, not a route into the
 * dapp.
 *
 * The constants below are DUPLICATED FROM leekzor/callhouse: `web/lib/contracts.ts`,
 * `web/lib/chain.ts` and `README.md` ON PURPOSE. This repo must build, typecheck and deploy with no
 * dependency on the dapp — it is a separate repo and Railway service with its own container, and a
 * shared package would drag viem (and therefore a wallet-shaped dependency tree) into a landing
 * page that makes no chain calls at all. This file DISPLAYS these addresses; it never calls them.
 * If an address changes, leekzor/callhouse: `README.md` and `ops/addresses.json` are the source of
 * truth and this file is updated by hand to match.
 *
 * Deliberately absent: chain clients, ABIs, and anything that reads live state. Nothing Stonkhouse
 * deploys is live yet: the vault and the vault's own Valorem Clear instance are listed below with a
 * null address and render as "published at launch", never as a made-up or placeholder address.
 * Every number on this site is a fixed policy parameter or a labelled rehearsal example, not a
 * quote.
 *
 * NO VENUE CONSTANT (redesign of 2026-09-13, leekzor/callhouse-contracts `src/lib/SeaportOrderLib.sol`
 * :179-181 and `README.md`:12-13). The vault sells through its own Seaport 1.6 listing, bought on the
 * app's fill page (FILL_PAGE_PATH) or through any Seaport 1.6 client. Earlier designs listed through
 * a third-party venue and read its registry; that constant and the registry row were removed with
 * them.
 */

/** Strip trailing slashes so joins never produce `//`. */
function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** This site. Used for canonical URLs and metadataBase. */
export const SITE_URL = normalizeBase(process.env.NEXT_PUBLIC_SITE_URL ?? "https://stonkhouse.fun");

/** Depositor documentation and the protocol reference (GitBook, synced from leekzor/callhouse-docs). */
export const DOCS_URL = normalizeBase(process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.stonkhouse.fun");

/** The dapp. Every CTA on this site points into it. */
export const APP_URL = normalizeBase(process.env.NEXT_PUBLIC_APP_URL ?? "https://app.stonkhouse.fun");

/**
 * Join a dapp route onto APP_URL. `appUrl("/vault/nvda")` and `appUrl("vault/nvda")` both give
 * `https://app.stonkhouse.fun/vault/nvda`, and `appUrl()` gives the bare origin with no trailing
 * slash. An absolute URL is passed through untouched so callers can hand this any href.
 */
export function appUrl(path = ""): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  const rest = path.replace(/^\/+/, "");
  return rest ? `${APP_URL}/${rest}` : APP_URL;
}

/**
 * First (and at launch, only) market. Matches MARKET / SHARE_TICKER in leekzor/callhouse:
 * `web/lib/contracts.ts`.
 */
export const MARKET = "NVDA";
export const SHARE_TICKER = "cNVDA";

/** Robinhood Chain mainnet, an Arbitrum Orbit L2. 4663 = 0x1237. */
export const CHAIN_ID = 4663;
export const CHAIN_NAME = "Robinhood Chain";

/**
 * Blockscout is the canonical explorer. Links only: its API sits behind a Cloudflare JS
 * challenge, and in any case nothing on this site fetches anything.
 */
export const EXPLORER_URL = "https://robinhoodchain.blockscout.com";

/**
 * The app route where the vault's weekly calls are bought: leekzor/callhouse `web/app/vault/nvda/cycle`.
 * The only first-party venue; any Seaport 1.6 client can fill the same order with its parameters.
 */
export const FILL_PAGE_PATH = "/vault/nvda/cycle";

export type AddressRow = {
  /** Label as it appears in the README addresses table. */
  label: string;
  /**
   * Checksummed, as confirmed on chain 4663 by leekzor/callhouse: `ops/recon/`. `null` for a
   * contract Stonkhouse deploys at launch: the page says "published at launch" instead.
   */
  address: string | null;
  /** One line on what it does, for the table's second column. */
  what: string;
};

/**
 * The contracts a week touches. Insertion order is display order. The first two are deployed by
 * Stonkhouse at launch and have no address yet (leekzor/callhouse-contracts `script/Deploy.s.sol`,
 * `script/DeployClear.s.sol`; the own-Clear decision is recorded in the 2026-09-14 audit findings,
 * I-01). The rest are third-party contracts already live on 4663. The fee Safe is an ops detail, not
 * a public integration point, and is not listed.
 */
export const ADDRESSES = {
  vault: {
    label: `Stonkhouse ${MARKET} vault (${SHARE_TICKER})`,
    address: null,
    what: "Holds the NVDA, issues cNVDA, and is both the offerer and the zone of its own listing. Not deployed yet.",
  },
  clear: {
    label: "Valorem Clear, the vault's own instance",
    address: null,
    what: "Deployed with the vault from Valorem's unmodified code. Holds the collateral of calls sold, mints each call inside the fill that buys it, and settles exercise.",
  },
  seaport: {
    label: "Seaport 1.6",
    address: "0x0000000000000068F116a894984e2DB1123eB395",
    what: "Settles each fill. It asks the vault before moving anything, so every fill runs the vault's own checks.",
  },
  usdg: {
    label: "USDG",
    address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
    what: "6 decimals. Every premium, strike and claim is denominated in it.",
  },
  asset: {
    label: `${MARKET} Stock Token`,
    address: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
    what: "18 decimals. The collateral, and a debt security issued by Robinhood Assets (Jersey) Limited.",
  },
  priceFeed: {
    label: "Chainlink RHNVDA / USD",
    address: "0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15",
    what: "8 decimals. Display, and the price floors checked when a week is armed and a call is sold. Settlement never reads a price feed.",
  },
} as const satisfies Record<string, AddressRow>;

/** Same rows, ordered, for rendering a table without Object.values() at the call site. */
export const ADDRESS_ROWS: readonly AddressRow[] = Object.values(ADDRESSES);

/** Explorer link for one of the addresses above. */
export function addressUrl(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}
