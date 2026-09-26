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
// Pin history, oldest first. The first pin was the pre-broadcast registry. The second was the
// post-broadcast registry, with NVDA and SPCX live with registeredAt among 35 markets.
// The third followed the cut from 35 markets to NVDA and SPCX only.
// The fourth followed a change that added the daily HouseVault fields. The markets, their v2.status
// and registeredAt did not change, so the projection (NVDA, SPCX; 2 rows) is byte-identical.
// The fifth followed two changes: one added the StockZap address and start block, and one added
// each market's chainlinkBand. Neither changed a v2.status or registeredAt, so the projection
// (NVDA, SPCX; 2 rows) is byte-identical.
// The sixth followed four changes: the registry became the source of every launch fee and limit,
// the House and Earn vault limits were added, SPCX was listed weekly only, and `dailyWeekdays` was
// added (NVDA mon, wed, fri). None changed a v2.status or registeredAt, so the projection
// (NVDA, SPCX; 2 rows) is byte-identical. The listing days are mirrored in lib/site.ts
// LISTED_EXPIRIES.
// The seventh followed the launch fee split change, v2.flywheel.config.burnBps 5000 -> 1000.
// No v2.status or registeredAt changed, so the projection (NVDA, SPCX; 2 rows) is
// byte-identical. The old pin had turned check-twins red against the app's main branch.
// The eighth followed the v9 launch (2026-09-25), which rewrote the registry: new contract
// addresses, v2.deployBlock 72462898, the daily House vaults and each market's v3 payoutRoute.
// NVDA and SPCX are still the only rows, both live with registeredAt, so the projection
// (NVDA, SPCX; 2 rows) is byte-identical.
// The current pin follows a text-only cleanup of the registry's note fields (the keeper and
// launch-set notes). No key or value changed, so the projection (NVDA, SPCX; 2 rows) is
// byte-identical.
//
// Each move of the pin is a deliberate edit here: a registry change alone makes
// assertV8RegistrySource throw until this blob id is updated.
//
export const V8_REGISTRY_BLOB = "fc0b6de9663768ab84c6f6ef5b78dbe621ddd3c1";

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
