/**
 * The front page's ticker price, always a number when anything can price it.
 * The order:
 *   1. the API's spot (/v2/markets), when present and fresh;
 *   2. the market's Chainlink feed;
 *   3. the market's Uniswap v3 pool;
 *   4. the last good price this server saw, with the time it was true.
 * Chain reads run on the server over the public RPC (lib/chainPrice.ts) and are reused for MEMO_S seconds, so page
 * loads do not hammer the RPC.
 */
import {
  CHAIN_SOURCES,
  MAX_FEED_AGE_S,
  chainlinkPrice,
  poolPrice,
  type ChainPrice,
  type ChainSource,
} from "./chainPrice.ts";

export type SpotSource = "api" | "chainlink" | "pool" | "cached";
/** A price in USDG base units (6 dp) per share, when it was true (unix seconds), and where it came from. */
export type ResolvedSpot = { raw: bigint; updatedAt: number; source: SpotSource };

/** Seconds a chain read is reused before the RPC is asked again. */
export const MEMO_S = 45;
/** An API spot older than this falls through to the chain (the same bound as a stale feed). */
export const MAX_API_AGE_S = MAX_FEED_AGE_S;

/** The chain readers, injectable so tests never touch the network. */
export type Readers = {
  chainlink: (source: ChainSource, now: number) => Promise<ChainPrice | null>;
  pool: (source: ChainSource, now: number) => Promise<ChainPrice | null>;
  now: () => number;
};

export const chainReaders: Readers = {
  chainlink: (source, now) => chainlinkPrice(source.feed, now),
  pool: (source, now) => poolPrice(source, now),
  now: () => Math.floor(Date.now() / 1000),
};

const lastGood = new Map<string, ResolvedSpot>();
const memo = new Map<string, { at: number; value: ResolvedSpot | null }>();

/** Forget every cached and reused price (tests). */
export function resetSpotCache(): void {
  lastGood.clear();
  memo.clear();
}

async function chainSpot(ticker: string, readers: Readers, now: number): Promise<ResolvedSpot | null> {
  const source = CHAIN_SOURCES[ticker];
  if (!source) return null;
  const hit = memo.get(ticker);
  if (hit && now - hit.at < MEMO_S) return hit.value;
  let value: ResolvedSpot | null = null;
  const feed = await readers.chainlink(source, now).catch(() => null);
  if (feed) {
    value = { raw: feed.raw, updatedAt: feed.updatedAt, source: "chainlink" };
  } else {
    const pool = await readers.pool(source, now).catch(() => null);
    if (pool) value = { raw: pool.raw, updatedAt: pool.updatedAt, source: "pool" };
  }
  memo.set(ticker, { at: now, value });
  return value;
}

/**
 * The price to show for `ticker`. `api` is the API's spot (raw USDG 6 dp and its time), or null when the API gave none.
 * Null only when nothing has ever priced this market on this server.
 */
export async function resolveSpot(
  ticker: string,
  api: { raw: bigint; updatedAt: number } | null,
  readers: Readers = chainReaders,
): Promise<ResolvedSpot | null> {
  const now = readers.now();
  const fresh = api !== null && api.raw > 0n && api.updatedAt <= now + 60 && now - api.updatedAt <= MAX_API_AGE_S;
  const value: ResolvedSpot | null = fresh
    ? { raw: api.raw, updatedAt: api.updatedAt, source: "api" }
    : await chainSpot(ticker, readers, now);
  if (value) {
    lastGood.set(ticker, value);
    return value;
  }
  const cached = lastGood.get(ticker);
  return cached ? { raw: cached.raw, updatedAt: cached.updatedAt, source: "cached" } : null;
}

/** USDG base units as the API's money object: `formatted` is dollars and cents, floored. */
export function usdgMoney(raw: bigint): { raw: string; decimals: 6; formatted: string } {
  const cents = raw / 10_000n;
  return { raw: raw.toString(), decimals: 6, formatted: `${cents / 100n}.${(cents % 100n).toString().padStart(2, "0")}` };
}
