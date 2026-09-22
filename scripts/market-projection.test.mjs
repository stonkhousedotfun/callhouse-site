import assert from "node:assert/strict";
import test from "node:test";

import { projectMarketRegistry, renderMarketProjection } from "./market-projection.mjs";

const row = (ticker, status, registeredAt) => ({ ticker, v2: { status, registeredAt } });

test("projects only live, registered v2 markets in registry order", () => {
  const projected = projectMarketRegistry({
    markets: [
      row("PLANNED", "planned", null),
      row("LIVE", "live", 123),
      row("PAUSED", "paused", 122),
      row("UNREG", "live", null),
    ],
  });

  assert.deepEqual(projected, { liveMarkets: ["LIVE"], registryMarketCount: 4 });
});

test("derives the total from the chosen registry representation", () => {
  const withPlannedSgov = { markets: [row("NVDA", "live", 123), row("SGOV", "planned", null)] };
  const withoutSgov = { markets: [row("NVDA", "live", 123)] };

  assert.equal(projectMarketRegistry(withPlannedSgov).registryMarketCount, 2);
  assert.equal(projectMarketRegistry(withoutSgov).registryMarketCount, 1);
});

test("renders a deterministic committed projection", () => {
  const rendered = renderMarketProjection({ liveMarkets: ["NVDA", "AAPL"], registryMarketCount: 2 });

  assert.match(rendered, /export const LIVE_MARKETS = \[\n  "NVDA",\n  "AAPL",\n\] as const;/);
  assert.match(rendered, /export const REGISTRY_MARKET_COUNT = 2;/);
});

test("rejects malformed and duplicate registry rows", () => {
  assert.throws(
    () => projectMarketRegistry({ markets: [row("NVDA", "live", 123), row("NVDA", "planned", null)] }),
    /duplicate registry ticker/,
  );
  assert.throws(() => projectMarketRegistry({ markets: [{ ticker: "NVDA" }] }), /valid v2\.status/);
  assert.throws(
    () => projectMarketRegistry({ markets: [{ ticker: "NVDA", v2: { status: "live" } }] }),
    /valid v2\.registeredAt/,
  );
});
