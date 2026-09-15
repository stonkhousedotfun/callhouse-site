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
 * If an address changes, this file is updated by hand to match the chain.
 *
 * Deliberately absent: chain clients, ABIs, and anything that reads live state. Every number on
 * this site is a policy setting as read on chain on 2026-09-15, a compiled limit, or a labelled
 * example, not a quote. What changes week to week (strike, ask, fills) lives in the app.
 *
 * LIVE ADDRESSES (confirmed on chain 4663, 2026-09-15): vault.clear(), vault.seaport(), vault.usdg(),
 * vault.asset() and vault.priceFeed() return exactly the rows below, and the vault's runtime links
 * both libraries. hasRole() confirms the three role holders in ROLE_KEYS, and the Clear's feeTo() is
 * ROLE_KEYS.clearFeeTo.
 *
 * NO VENUE CONSTANT (redesign of 2026-09-13, leekzor/callhouse-contracts `src/lib/SeaportOrderLib.sol`
 * :179-181 and `README.md`:12-13). The vault sells through its own Seaport 1.6 listing, served on the
 * app's cycle page (FILL_PAGE_PATH). Earlier designs listed through a third-party venue and read its
 * registry; that constant and the registry row were removed with them.
 */

/** Strip trailing slashes so joins never produce `//`. */
function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** This site. Used for canonical URLs and metadataBase. */
export const SITE_URL = normalizeBase(process.env.NEXT_PUBLIC_SITE_URL ?? "https://stonkhouse.fun");

/** Depositor documentation and the protocol reference (GitBook, synced from leekzor/callhouse-docs). */
export const DOCS_URL = normalizeBase(process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.stonkhouse.fun");

/** X (Twitter). Override with NEXT_PUBLIC_X_URL if the handle is not @stonkhouse. */
export const X_URL = normalizeBase(process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/stonkhouse");

/** GitHub org. Repos may be private; the org page is still the public door. */
export const GITHUB_URL = normalizeBase(process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/leekzor");

/** The dapp. Every CTA on this site points into it. */
export const APP_URL = normalizeBase(process.env.NEXT_PUBLIC_APP_URL ?? "https://app.stonkhouse.fun");

/**
 * Join a dapp route onto APP_URL. `appUrl("/vault/nvda")` and `appUrl("vault/nvda")` both give
 * `https://app.stonkhouse.fun/vault/nvda`, and `appUrl()` gives the bare origin with no trailing
 * slash. An absolute URL is passed through untouched so callers can hand this any href.
 *
 * "Open the app" goes to the app frontpage (`OPEN_APP`), not the vault. A visitor who is ready to
 * deposit is sent to `VAULT_APP`. The two are different pages; do not collapse them.
 */
export function appUrl(path = ""): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  const rest = path.replace(/^\/+/, "");
  return rest ? `${APP_URL}/${rest}` : APP_URL;
}

/** App frontpage. "Open the app" on this site lands here. */
export const OPEN_APP = APP_URL;

/** Deposit NVDA and request lots. */
export const VAULT_APP = appUrl("/account");

/**
 * First (and so far only) market. Matches MARKET / SHARE_TICKER in leekzor/callhouse:
 * `web/lib/contracts.ts`.
 */
export const MARKET = "NVDA";
export const SHARE_TICKER = "cNVDA";

/**
 * Public product status. The landing, footer and risks glance read these so "beta" and
 * "pending audit" cannot drift across pages. "Pending" means no report yet, not that one has
 * started on a named firm. The contracts remain unaudited until a report is published.
 */
export const STATUS = {
  phase: "Beta",
  audit: "Pending audit",
  auditLine: "The Stonkhouse contracts have not been audited. An external audit is pending.",
} as const;

/** Robinhood Chain mainnet, an Arbitrum Orbit L2. 4663 = 0x1237. */
export const CHAIN_ID = 4663;
export const CHAIN_NAME = "Robinhood Chain";

/**
 * Blockscout is the canonical explorer. Links only: its API sits behind a Cloudflare JS
 * challenge, and in any case nothing on this site fetches anything.
 */
export const EXPLORER_URL = "https://robinhoodchain.blockscout.com";

/**
 * The app route where the vault's weekly calls are bought and exercised: leekzor/callhouse
 * `web/app/vault/nvda/cycle`. The only venue that serves the vault's order.
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
 * The contracts a week touches. Insertion order is display order. The first four were deployed by
 * the Stonkhouse admin key on 2026-09-15 (the Clear in block 63467465, the vault in 63467882); the
 * rest are third-party contracts. Sourcify v2: the vault is `match` on creation and runtime code,
 * both libraries `match` on runtime code (partial matches: everything but the metadata hash); the
 * Clear is not verified, and its 16,110-byte runtime equals, outside the trailing CBOR metadata, a
 * Clear that Sourcify verifies against valorem-core 6436c823.
 */
export const ADDRESSES = {
  factory: {
    label: `Stonkhouse ${MARKET} account factory`,
    address: "0x7850Ae4ac03b651263cE78EC5FcED11b0d0e05A7",
    what: `Deploys each user's isolated 1-lot account. A fill writes that user's ${MARKET} and pays that user.`,
  },
  vault: {
    label: `Retired pooled vault (${SHARE_TICKER})`,
    address: "0x88a98931E3682137E7e4D3426f623247f4A4ecbb",
    what: `Wound down. Not used for new deposits. Its on-chain token name, "Callhouse ${MARKET}", predates the rename.`,
    verified: "Verified on Sourcify as a partial match: the code matches, the metadata hash does not.",
  },
  clear: {
    label: "Valorem Clear, the vault's own instance",
    address: "0x53d7A6d0489Daf3d67b9A314e0eAB2B78Acab9C6",
    what: "Deployed from Valorem's code. Holds the collateral of calls sold, mints each call inside the fill that buys it, and settles exercise.",
    verified:
      "Not source-verified yet. Its runtime bytecode matches Valorem's published code at commit 6436c823 except the metadata hash.",
  },
  seaportOrderLib: {
    label: "SeaportOrderLib",
    address: "0x6B617a0B578Ef6EDCD07774468f08b3778272D8A",
    what: "Library linked into the vault. Checks the shape of every listing the keeper proposes.",
    verified: "Verified on Sourcify as a partial match.",
  },
  valoremLib: {
    label: "ValoremLib",
    address: "0xd3CB94893EAb55e425cCd77Db98458b38D75Fa3d",
    what: "Library linked into the vault. The arm checks, the checks at each fill, and the price-feed read.",
    verified: "Verified on Sourcify as a partial match.",
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
    what: "8 decimals. Display, and the price floors checked when a week is armed, a listing is approved and a call is sold. Settlement never reads a price feed.",
  },
} as const satisfies Record<string, AddressRow>;

/**
 * Who holds the keys, as read on chain 2026-09-15 (vault hasRole; Clear feeTo; Safe getOwners and
 * getThreshold). The admin is also the
 * vault's feeRecipient(). The Clear's fee address is a Safe v1.4.1 with one owner and threshold 1.
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
