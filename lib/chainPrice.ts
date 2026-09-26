/**
 * Server-side chain reads for the front page's ticker price: the Chainlink feed and the Uniswap v3 pool of
 * each launch market, over the chain's public RPC. No wallet, no key, no client code: plain `eth_call` over fetch.
 *
 * Prices come back in USDG base units (6 decimals) per whole share, the same unit as the API's `spot.raw`.
 */

/** Chain 4663's public RPC. Server-only: never a NEXT_PUBLIC variable, never a keyed URL in the client. */
export const PUBLIC_RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const RPC_URL = process.env.CHAIN_RPC_URL?.trim() || PUBLIC_RPC_URL;

/** A Chainlink answer older than this is treated as stale (the registry's feed staleness bound, 26 h). */
export const MAX_FEED_AGE_S = 26 * 60 * 60;

/** Where each launch market's price can be read on chain 4663 (callhouse ops/markets/v2-sources.json). */
export type ChainSource = {
  /** Chainlink price feed (AggregatorV3). */
  feed: string;
  /** The deepest Uniswap v3 pool of the Stock Token against USDG. */
  pool: string;
  /** True when the Stock Token is the pool's token0 (USDG is then token1). */
  stockIsToken0: boolean;
};

export const CHAIN_SOURCES: Readonly<Record<string, ChainSource>> = {
  // pool token0 = USDG 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168, token1 = NVDA 0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC
  NVDA: {
    feed: "0x379EC4f7C378F34a1B47E4F3cbeBCbAC3E8E9F15",
    pool: "0xd4EB21209C4D6093f80B5b84f5C45cc093EA14a3",
    stockIsToken0: false,
  },
  // pool token0 = SPCX 0x4a0E65A3EcceC6dBe60AE065F2e7bb85Fae35eEa, token1 = USDG
  SPCX: {
    feed: "0xB265810950ba6c5C0Ff821c9963014a56fD8Bffb",
    pool: "0xc61284332117c3FB23A2A56cceFFD07F7aF60029",
    stockIsToken0: true,
  },
};

/** One price read: USDG base units (6 dp) per share, and when it was true (unix seconds). */
export type ChainPrice = { raw: bigint; updatedAt: number };

/** `eth_call` returning the hex result, or null on any failure. Injectable so tests never touch the network. */
export type Rpc = (to: string, data: string) => Promise<string | null>;

const SELECTOR = {
  decimals: "0x313ce567",
  latestRoundData: "0xfeaf968c",
  slot0: "0x3850c7bd",
} as const;

const Q192 = 1n << 192n;
const SHARE = 10n ** 18n; // Stock Tokens have 18 decimals
const MAX_PRICE = (1n << 128n) - 1n;

export const publicRpc: Rpc = async (to, data) => {
  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to, data }, "latest"] }),
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return null;
    const body = await response.json() as { result?: unknown };
    return typeof body.result === "string" && /^0x([0-9a-fA-F]{64})+$/.test(body.result) ? body.result : null;
  } catch {
    return null;
  }
};

/** The `index`-th 32-byte word of an ABI result, as an unsigned bigint. */
function word(hex: string, index: number): bigint | null {
  const start = 2 + index * 64;
  if (hex.length < start + 64) return null;
  return BigInt(`0x${hex.slice(start, start + 64)}`);
}

/** Two's-complement int256 from a word. */
function signed(value: bigint): bigint {
  return value >= 1n << 255n ? value - (1n << 256n) : value;
}

/** A feed answer with `decimals` decimals, as USDG base units (6 dp), floored. Null for a non-positive answer. */
export function toUsdg6(answer: bigint, decimals: number): bigint | null {
  if (answer <= 0n || !Number.isInteger(decimals) || decimals < 0 || decimals > 77) return null;
  const price = decimals >= 6 ? answer / 10n ** BigInt(decimals - 6) : answer * 10n ** BigInt(6 - decimals);
  return price > 0n && price <= MAX_PRICE ? price : null;
}

/**
 * The pool's current price as USDG base units per whole share, from `slot0.sqrtPriceX96`.
 * Raw price = sqrtPriceX96^2 / 2^192 = token1 base units per token0 base unit.
 */
export function poolPriceUsdg6(sqrtPriceX96: bigint, stockIsToken0: boolean): bigint | null {
  if (sqrtPriceX96 <= 0n) return null;
  const squared = sqrtPriceX96 * sqrtPriceX96;
  // stock = token0: USDG per stock unit = squared / 2^192, times 1e18 units per share.
  // stock = token1: USDG per stock unit = 2^192 / squared, times 1e18 units per share.
  const price = stockIsToken0 ? (squared * SHARE) / Q192 : (Q192 * SHARE) / squared;
  return price > 0n && price <= MAX_PRICE ? price : null;
}

/** The Chainlink feed's latest answer, or null when it cannot be read, is not positive, or is older than MAX_FEED_AGE_S. */
export async function chainlinkPrice(feed: string, now: number, rpc: Rpc = publicRpc): Promise<ChainPrice | null> {
  const [dec, round] = await Promise.all([rpc(feed, SELECTOR.decimals), rpc(feed, SELECTOR.latestRoundData)]);
  if (!dec || !round) return null;
  const decimals = word(dec, 0);
  const answer = word(round, 1);
  const updatedAt = word(round, 3);
  if (decimals === null || answer === null || updatedAt === null || decimals > 77n) return null;
  const at = Number(updatedAt);
  if (!Number.isSafeInteger(at) || at <= 0 || at > now + 60 || now - at > MAX_FEED_AGE_S) return null;
  const raw = toUsdg6(signed(answer), Number(decimals));
  return raw === null ? null : { raw, updatedAt: at };
}

/** The pool's spot price now (`slot0`), or null when it cannot be read. */
export async function poolPrice(source: ChainSource, now: number, rpc: Rpc = publicRpc): Promise<ChainPrice | null> {
  const slot0 = await rpc(source.pool, SELECTOR.slot0);
  const sqrt = slot0 ? word(slot0, 0) : null;
  if (sqrt === null) return null;
  const raw = poolPriceUsdg6(sqrt & ((1n << 160n) - 1n), source.stockIsToken0);
  return raw === null ? null : { raw, updatedAt: now };
}
