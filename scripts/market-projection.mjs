/**
 * Project the app's canonical market registry into the small committed view the site needs.
 *
 * A v2 row is public-live only when it has both the live status and registration evidence. This
 * deliberately matches callhouse/web/lib/markets.ts rather than treating every registered or
 * merely planned row as available. The total is the number of rows actually present, so removing
 * an excluded market changes the generated count without a site-side ticker exception.
 */
import { createHash } from "node:crypto";

// git -C callhouse rev-parse v8:ops/markets/tier1.json at the v8 source used for this projection.
// A registry edit requires an explicit new source pin, not a self-consistent stale regeneration.
export const V8_REGISTRY_BLOB = "a144e8972f92e6e44c7edbb84d13133ddadbde68";

export function assertV8RegistrySource(source) {
  const bytes = Buffer.from(source);
  const blob = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
  if (blob !== V8_REGISTRY_BLOB) {
    throw new Error(`registry source blob ${blob} is not pinned v8 blob ${V8_REGISTRY_BLOB}`);
  }
}

export function projectMarketRegistry(registry) {
  if (!registry || !Array.isArray(registry.markets)) {
    throw new Error("registry.markets must be an array");
  }

  const seen = new Set();
  const liveMarkets = [];

  for (const [index, market] of registry.markets.entries()) {
    const ticker = market?.ticker;
    if (typeof ticker !== "string" || !/^[A-Z][A-Z0-9]{0,9}$/.test(ticker)) {
      throw new Error(`registry.markets[${index}].ticker must match /^[A-Z][A-Z0-9]{0,9}$/`);
    }
    if (seen.has(ticker)) throw new Error(`duplicate registry ticker: ${ticker}`);
    seen.add(ticker);

    if (!market.v2 || !["planned", "live", "paused"].includes(market.v2.status)) {
      throw new Error(`registry market ${ticker} has no valid v2.status`);
    }
    if (
      market.v2.registeredAt !== null &&
      (!Number.isSafeInteger(market.v2.registeredAt) || market.v2.registeredAt < 0)
    ) {
      throw new Error(`registry market ${ticker} has no valid v2.registeredAt`);
    }
    if (market.v2.status === "live" && market.v2.registeredAt !== null) {
      liveMarkets.push(ticker);
    }
  }

  return { liveMarkets, registryMarketCount: registry.markets.length };
}

/** Render the committed TypeScript projection deterministically for a byte-for-byte drift check. */
export function renderMarketProjection({ liveMarkets, registryMarketCount }) {
  const tickers = liveMarkets.map((ticker) => `  ${JSON.stringify(ticker)},`).join("\n");
  return `// GENERATED from callhouse ops/markets/tier1.json by the coordinated registry projection — do not edit.
// scripts/check-twins.mjs verifies both exports against the app registry.

/** V2 markets that the app registry currently marks live and registered, in registry order. */
export const LIVE_MARKETS = [
${tickers}${tickers ? "\n" : ""}] as const;

/** Rows currently present in the app registry, including planned and paused markets. */
export const REGISTRY_MARKET_COUNT = ${registryMarketCount};
`;
}
