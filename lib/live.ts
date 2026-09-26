/** Read-only v2 API client for server-rendered marketing copy. Bad or absent data is never presented as live. */
import { LIVE_MARKETS } from "./markets.generated.ts";
import { chainReaders, resolveSpot, usdgMoney, type Readers, type SpotSource } from "./spotFallback.ts";

export type Money = { raw: string; decimals: 6; formatted: string };
export type LiveCard = {
  series: { longId: string; ticker: string; isPut: boolean; strike: Money; expiry: number; status: string };
  /** Null when this market's live oracle read failed. Authority: indexer cardSchema.spot = moneySchema.nullable() at indexer/src/api/v2/schema.ts:398. Not invented. */
  spot: Money | null;
  ask: Money;
  target: Money;
  perUnit: { cost: Money; payoutAtTarget: Money; multiple: number };
  perShare: { cost: Money; payoutAtTarget: Money; multiple: number } | null;
  maxLoss: "cost";
  unitsAvailable: string;
};
export type LiveStats = { contractsFilled: string; biggestWinWeek: { multiple: number; ticker: string } | null };

/** Preserve an unavailable/invalid feed separately from a valid response with no active cards. */
export function cardsAvailability(cards: LiveCard[] | null): "unavailable" | "empty" | "available" {
  return cards === null ? "unavailable" : cards.length === 0 ? "empty" : "available";
}

const BASE = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
const LIVE_MARKET_SET: ReadonlySet<string> = new Set(LIVE_MARKETS);
// ECMAScript Date's maximum time value is 8.64e15 milliseconds. Expiry is Unix seconds.
const MAX_DATE_EXPIRY = 8_640_000_000_000;

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
function money(value: unknown): Money | null {
  const x = object(value);
  return x && typeof x.raw === "string" && /^\d+$/.test(x.raw) && x.decimals === 6 &&
    typeof x.formatted === "string" ? x as Money : null;
}
function payout(value: unknown): LiveCard["perUnit"] | null {
  const x = object(value);
  const cost = money(x?.cost);
  const atTarget = money(x?.payoutAtTarget);
  return x && cost && atTarget && typeof x.multiple === "number" && Number.isFinite(x.multiple) &&
    x.multiple >= 0 && BigInt(cost.raw) > 0n ? { cost, payoutAtTarget: atTarget, multiple: x.multiple } : null;
}
function liveTicker(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z][A-Z0-9]{0,9}$/.test(value) && LIVE_MARKET_SET.has(value);
}
function card(value: unknown): LiveCard | null {
  const x = object(value);
  const series = object(x?.series);
  const strike = money(series?.strike);
  // cardSchema.spot is nullable (schema.ts:398). Null is a valid "this market's oracle failed"
  // observation; omitting the field or sending a non-money object is not. Ask/target/perUnit stay
  // required (schema.ts:399-401); perShare stays nullable (schema.ts:402) matching cardTicketSchema
  // at schema.ts:379-381.
  const spot = x?.spot === null ? null : money(x?.spot);
  const ask = money(x?.ask);
  const target = money(x?.target);
  const perUnit = payout(x?.perUnit);
  const perShare = x?.perShare === null ? null : payout(x?.perShare);
  if (!x || !series || !strike || (x.spot !== null && !spot) || !ask || !target || !perUnit || x.perShare !== null && !perShare ||
      typeof series.longId !== "string" || !/^\d+$/.test(series.longId) ||
      !liveTicker(series.ticker) ||
      typeof series.isPut !== "boolean" || typeof series.expiry !== "number" ||
      !Number.isSafeInteger(series.expiry) || series.expiry <= 0 || series.expiry > MAX_DATE_EXPIRY ||
      typeof series.status !== "string" || x.maxLoss !== "cost" ||
      typeof x.unitsAvailable !== "string" || !/^\d+$/.test(x.unitsAvailable) ||
      BigInt(strike.raw) === 0n || BigInt(target.raw) === 0n || BigInt(ask.raw) === 0n) return null;
  return { series: { longId: series.longId, ticker: series.ticker, isPut: series.isPut,
    strike, expiry: series.expiry, status: series.status }, spot, ask, target, perUnit, perShare,
    maxLoss: "cost", unitsAvailable: x.unitsAvailable };
}
function active(value: LiveCard): boolean {
  return (value.series.status === "open" || value.series.status === "cutoff") &&
    value.series.expiry > Math.floor(Date.now() / 1000) && BigInt(value.unitsAvailable) > 0n;
}

async function read(path: string, revalidate = 60): Promise<unknown | null> {
  if (!BASE || !/^https?:\/\/[^/]+/.test(BASE)) return null;
  try {
    const response = await fetch(`${BASE}${path}`, {
      next: { revalidate }, signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) return null;
    return await response.json() as unknown;
  } catch {
    return null;
  }
}

export async function getHero(revalidate = 60): Promise<LiveCard | null> {
  const data = object(await read("/v2/cards/hero", revalidate));
  const result = card(data?.card);
  return result && result.perShare && active(result) ? result : null;
}

export async function getCards(): Promise<LiveCard[] | null> {
  const data = object(await read("/v2/cards?limit=6"));
  if (!data || !Array.isArray(data.items)) return null;
  const items = data.items.slice(0, 6).map(card);
  // KEEP voiding the whole list on one unparseable item. A ticker outside LIVE_MARKETS, a missing
  // ask, or a malformed money object is a response-integrity failure, not "this market's oracle
  // blipped." Null spot no longer maps to null here (card() accepts it), so an oracle miss on one
  // sibling can no longer blank the row. Filtering garbage would also change the existing
  // live-ticker tests in lib/live.test.mts:36-57.
  if (items.some((item) => item === null)) return null;
  return (items as LiveCard[]).filter(active);
}

export async function getStats(): Promise<LiveStats | null> {
  const data = object(await read("/v2/stats"));
  const win = data?.biggestWinWeek === null ? null : object(data?.biggestWinWeek);
  if (!data || typeof data.contractsFilled !== "string" || !/^\d+$/.test(data.contractsFilled) ||
      data.biggestWinWeek !== null && (!win || typeof win.multiple !== "number" ||
      !Number.isFinite(win.multiple) || win.multiple < 0 || typeof win.ticker !== "string" ||
      !/^[A-Z][A-Z0-9]{0,9}$/.test(win.ticker))) return null;
  return { contractsFilled: data.contractsFilled,
    biggestWinWeek: win ? { multiple: win.multiple as number, ticker: win.ticker as string } : null };
}

/**
 * One launch market's price for the front page's ticker cards. `source` says where the price
 * came from (lib/spotFallback.ts); absent on rows built elsewhere.
 */
export type LiveSpot = {
  ticker: string;
  name: string;
  spot: Money | null;
  spotUpdatedAt: number | null;
  source?: SpotSource;
};

/** The API's /v2/markets rows for live markets, by ticker; null when the read failed or a live row broke its shape. */
function apiMarkets(data: unknown): Map<string, { name: string; spot: Money | null; spotUpdatedAt: number | null }> | null {
  if (!Array.isArray(data)) return null;
  const byTicker = new Map<string, { name: string; spot: Money | null; spotUpdatedAt: number | null }>();
  for (const value of data) {
    const x = object(value);
    if (!x || typeof x.ticker !== "string" || !LIVE_MARKET_SET.has(x.ticker)) continue;
    const spot = x.spot === null ? null : money(x.spot);
    const at = x.spotUpdatedAt;
    const atOk = at === null || (typeof at === "number" && Number.isSafeInteger(at) && at > 0 && at <= MAX_DATE_EXPIRY);
    if (typeof x.name !== "string" || !x.name || (x.spot !== null && !spot) || !atOk || (spot === null) !== (at === null)) return null;
    byTicker.set(x.ticker, { name: x.name, spot, spotUpdatedAt: at as number | null });
  }
  return byTicker;
}

/**
 * The front page's ticker cards: one row per generated live market, in LIVE_MARKETS order, each with a price whenever
 * anything can price it.
 *
 * The price chain is lib/spotFallback.ts: the API's /v2/markets spot when present and fresh, else the market's
 * Chainlink feed, else its Uniswap v3 pool, else the last good price this server saw. The API rows are still
 * validated as before: the indexer's marketSchema makes `spot` and `spotUpdatedAt` both present or both null, and a
 * live row that breaks the shape (no name, a malformed money object, one of the pair without the other) means the
 * whole API read is not used -- every card then comes from the chain. Rows for markets outside LIVE_MARKETS are
 * ignored. The result is never null; a card's spot is null only when nothing has ever priced that market here.
 */
export async function getSpots(revalidate = 60, readers: Readers = chainReaders): Promise<LiveSpot[]> {
  const api = apiMarkets(await read("/v2/markets", revalidate));
  return Promise.all(LIVE_MARKETS.map(async (ticker): Promise<LiveSpot> => {
    const row = api?.get(ticker);
    const apiSpot = row?.spot && row.spotUpdatedAt !== null
      ? { raw: BigInt(row.spot.raw), updatedAt: row.spotUpdatedAt }
      : null;
    const resolved = await resolveSpot(ticker, apiSpot, readers);
    const name = row?.name ?? ticker;
    if (!resolved) return { ticker, name, spot: null, spotUpdatedAt: null };
    // The API's own money object is kept as sent; a chain or cached price is formatted here.
    const spot = resolved.source === "api" && row?.spot ? row.spot : usdgMoney(resolved.raw);
    return { ticker, name, spot, spotUpdatedAt: resolved.updatedAt, source: resolved.source };
  }));
}
