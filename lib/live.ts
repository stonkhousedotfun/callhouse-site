/** Read-only v2 API client for server-rendered marketing copy. Bad or absent data is never presented as live. */
export type Money = { raw: string; decimals: 6; formatted: string };
export type LiveCard = {
  series: { longId: string; ticker: string; isPut: boolean; strike: Money; expiry: number; status: string };
  spot: Money;
  ask: Money;
  target: Money;
  perUnit: { cost: Money; payoutAtTarget: Money; multiple: number };
  perShare: { cost: Money; payoutAtTarget: Money; multiple: number } | null;
  maxLoss: "cost";
  unitsAvailable: string;
};
export type LiveStats = { contractsFilled: string; biggestWinWeek: { multiple: number; ticker: string } | null };

const BASE = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

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
function card(value: unknown): LiveCard | null {
  const x = object(value);
  const series = object(x?.series);
  const strike = money(series?.strike);
  const spot = money(x?.spot);
  const ask = money(x?.ask);
  const target = money(x?.target);
  const perUnit = payout(x?.perUnit);
  const perShare = x?.perShare === null ? null : payout(x?.perShare);
  if (!x || !series || !strike || !spot || !ask || !target || !perUnit || x.perShare !== null && !perShare ||
      typeof series.longId !== "string" || !/^\d+$/.test(series.longId) ||
      typeof series.ticker !== "string" || !/^[A-Z][A-Z0-9]{0,9}$/.test(series.ticker) ||
      typeof series.isPut !== "boolean" || typeof series.expiry !== "number" ||
      !Number.isSafeInteger(series.expiry) || series.expiry <= 0 ||
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
