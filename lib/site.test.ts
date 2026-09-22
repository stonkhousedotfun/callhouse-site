import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { takerFeeCapHeadline, writerCollateralHeadline } from "./fees.ts";
import { cardsAvailability } from "./live.ts";
import { breakeven, costToBuy, payoutAt, takerFee } from "./payoff.ts";
import { mintRent, writerCapacity, writerCollateralNeed } from "./rent.ts";
import { ADDRESSES, FEES_V2, LAUNCH_SET, REGISTRY_MARKET_COUNT, delayHours, feePct, listTickers } from "./site.ts";

const REMOVED_V7_KEYS = [
  "v2Clearinghouse",
  "v2OrderBook",
  "v2SettlementOracle",
  "v2ExpiryCalendar",
  "v2PayoutAdapter",
] as const;

test("site address rows exclude frozen v7 option contracts", () => {
  for (const key of REMOVED_V7_KEYS) {
    assert.equal(Object.hasOwn(ADDRESSES, key), false, `${key} must not be published on the site`);
  }
});

test("v8 taker fee applies the per-take discount after the capped base", () => {
  const params = { takerFeeFlat: 100_000n, takerFeeCapBps: 1_000, discountBps: 2_500 };
  assert.equal(takerFee(2_000_000n, params), 75_000n);
  assert.equal(takerFee(100_000n, params), 7_500n);
  assert.equal(takerFee(2_000_000n, { ...params, discountBps: 0 }), 100_000n);
  assert.throws(() => takerFee(2_000_000n, { ...params, discountBps: 5_001 }), /discountBps/);
});

test("missing write-ask inputs remain visible rather than becoming absent depth", () => {
  const fees = { takerFeeFlat: 100_000n, takerFeeCapBps: 1_000, discountBps: 0 };
  const ask = { orderId: "1", kind: "AskWrite" as const, maker: "0x123", price: 1_000_000n,
    units: 1n, makerFreeCollateral: null };
  const unpriceable = costToBuy([ask], 1n, fees);
  const absent = costToBuy([], 1n, fees);
  assert.equal(unpriceable.pricingStatus, "unpriceable");
  assert.deepEqual(unpriceable.unpriceableAsks, [{ orderId: "1", reason: "rent" }]);
  assert.equal(absent.pricingStatus, "priced");
  assert.deepEqual(absent.unpriceableAsks, []);
  assert.equal(costToBuy([ask], 1n, fees, { collateralPerUnit: 1n, mintFeePpm: 0,
    expiry: 1_800_604_800, snapshotTimestamp: 1_800_000_000 }).unpriceableAsks[0]?.reason, "collateral");
});

test("call conversion floors the whole owed amount before break-even valuation", () => {
  const position = { isPut: false, strike: 223_000_000n, units: 100n,
    exerciseFeeBps: 25, conversionFloorBps: 9_700 };
  assert.equal(payoutAt(240_000_000n, position), 15_907_999n);
  assert.equal(breakeven(position, 1_100_000n), 224_260_024n);
  assert.equal(payoutAt(224_260_023n, position), 1_099_999n);
  assert.equal(payoutAt(224_260_024n, position), 1_100_000n);
  assert.equal(payoutAt(100_000_104n, { ...position, strike: 100_000_000n, exerciseFeeBps: 0 }), 99n);
  assert.equal(payoutAt(190_000_000n, { isPut: true, strike: 200_000_000n, units: 1n, exerciseFeeBps: 25 }), 95_000n);
});

test("nonzero v8 rent dial already budgets collateral and rent exactly", () => {
  const terms = { collateralPerUnit: 2_000_000n, mintFeePpm: 1_200,
    expiry: 1_800_604_800, snapshotTimestamp: 1_800_000_000 };
  assert.equal(mintRent(100n, terms), 240_000n);
  assert.equal(writerCollateralNeed(100n, terms), 200_240_000n);
  assert.equal(writerCapacity(200_000_000n, terms), 99n);
});

test("three displayed fee headlines derive from FEES_V2", () => {
  const page = readFileSync(new URL("../app/how-it-works/page.tsx", import.meta.url), "utf8");
  const slip = readFileSync(new URL("../app/_components/FeeSlip.tsx", import.meta.url), "utf8");
  assert.ok(/<dt className="font-bold">Writer collateral charge<\/dt><dd[^>]*>\{writerCollateralHeadline\(FEES_V2\.writerCollateralRatePpm\)\}<\/dd>/.test(page), "page writer headline must bind FEES_V2");
  assert.ok(/<Row label="Writer collateral charge"[^>]*value=\{writerCollateralHeadline\(FEES_V2\.writerCollateralRatePpm\)\}/.test(slip), "fee slip writer headline must bind FEES_V2");
  assert.ok(/<dt className="font-bold">Taker fee<\/dt><dd[^>]*>\{takerFeeCapHeadline\(FEES_V2\.takerFlatRaw\)\}<\/dd>/.test(page), "page taker headline must bind FEES_V2");
  assert.equal(writerCollateralHeadline(FEES_V2.writerCollateralRatePpm),
    FEES_V2.writerCollateralRatePpm === 0 ? "0 at launch" : `${FEES_V2.writerCollateralRatePpm} ppm`);
  assert.equal(takerFeeCapHeadline(FEES_V2.takerFlatRaw),
    `${(Number(FEES_V2.takerFlatRaw) / 1_000_000).toFixed(2)} USDG cap`);
});

test("unavailable live card feed is not an empty valid book on screen", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.ok(/<h3[^>]*>\{!showCardsFeed \?[^\n]*cardsAvailability\(cards\) === "unavailable" \? "Cannot price live cards right now" : "No fillable v2 cards to show right now"\}<\/h3>/.test(page), "page heading must branch on unavailable versus empty feed");
  assert.ok(/cardsAvailability\(cards\) === "unavailable" \? "The live card feed could not be priced or validated/.test(page), "page description must explain unavailable feed");
  assert.equal(cardsAvailability(null), "unavailable");
  assert.equal(cardsAvailability([]), "empty");
});

/*
 * T-OP-091 / F-SITE-02. The fee prose on /terms, /legal and /how-it-works used to be hand-typed beside
 * FEES_V2, and once copy-lint was removed (owner instruction 2026-09-21, commit 18ad2eec) nothing bound the
 * two. These tests are that binding: (1) the formatters render the sentences exactly as they read before,
 * (2) the three page sources contain no literal fee figure and reference FEES_V2 through the formatters,
 * (3) FEES_V2 mirrors the contract constants it discloses. The expected values in (3) are HAND-COPIED on
 * purpose — the test's job is to make drift loud — and each names the constant and SHA it mirrors:
 *   callhouse-contracts d01d3c58284b03636358cc429e18817579d33653:
 *     src/v2/interfaces/V2Constants.sol:60  FEE_CHANGE_DELAY = 48 hours          (OrderBook.setFeeParams window)
 *     src/v2/access/V8Roles.sol:116         MARKET_FEE_MANAGER_DELAY = 72 hours  (setMarketFees: exercise fee + collateral rate)
 *     src/v2/interfaces/V2Constants.sol:80  EXERCISE_FEE_MAX_PAYOUT_SHARE_BPS = 1000
 *     src/v2/interfaces/V2Constants.sol:75  PREMIUM_FEE_CEIL_BPS = 1000          (ceiling the 500 below must sit under)
 *   callhouse e7dc2345a9cb9d9b221beaa4d62ff9347cacc4ef ops/markets/tier1.json `v2.fees` (the launch values
 *   DeployV8 reads through V2_PREMIUM_FEE_BPS etc., V2DeployBase.sol:391-397):
 *     premiumFeeBps 500, resaleFeeBps 0, takerFeeFlat "100000", takerFeeCapBps 1000, exerciseFeeBps 25, mintFeePpm 0
 * The 72 h the two legal pages state is the MARKET-fee lane (collateral rate and exercise fee, pinned per series),
 * not the 48 h general fee-change delay; both live in FEES_V2 and the prose cites the right one.
 */
test("fee prose formatters render the disclosure figures exactly as the pages read before T-OP-091", () => {
  assert.equal(feePct(FEES_V2.premiumBps), "5%");
  assert.equal(feePct(FEES_V2.resalePremiumBps), "0%");
  assert.equal(feePct(FEES_V2.exerciseBps), "0.25%");
  assert.equal(feePct(1_000), "10%");
  assert.equal(delayHours(FEES_V2.marketFeeChangeDelayHours), "72 hours");
  assert.equal(delayHours(FEES_V2.feeChangeDelayHours), "48 hours");
  assert.throws(() => feePct(-1), RangeError);
  assert.throws(() => feePct(2.5), RangeError);
  assert.throws(() => delayHours(0), RangeError);
});

test("no fee figure on /terms, /legal or /how-it-works is a literal; each binds FEES_V2 through the formatters", () => {
  const pages = ["app/terms/page.tsx", "app/legal/page.tsx", "app/how-it-works/page.tsx"] as const;
  for (const rel of pages) {
    const src = readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
    // The retired literals. `\b` keeps "5%" from matching inside a longer number; "72 hours" is the exact old text.
    assert.equal(/\b5%|\b0%|72 hours/.test(src), false, `${rel} still states a fee figure as a literal`);
    assert.ok(/feePct\(FEES_V2\.premiumBps\)/.test(src), `${rel} must render the first-sale fee from FEES_V2`);
    assert.ok(/feePct\(FEES_V2\.resalePremiumBps\)/.test(src), `${rel} must render the resale fee from FEES_V2`);
  }
  for (const rel of ["app/terms/page.tsx", "app/legal/page.tsx"] as const) {
    const src = readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
    assert.ok(/\{delayHours\(FEES_V2\.marketFeeChangeDelayHours\)\}&apos; on-chain notice/.test(src), `${rel} must render the market-fee delay from FEES_V2`);
  }
});

test("FEES_V2 mirrors the contract constants and launch registry values it discloses (hand-copied, see comment)", () => {
  // V2Constants.sol:60 FEE_CHANGE_DELAY = 48 hours @ d01d3c58
  assert.equal(FEES_V2.feeChangeDelayHours, 48);
  // V8Roles.sol:116 MARKET_FEE_MANAGER_DELAY = 72 hours @ d01d3c58
  assert.equal(FEES_V2.marketFeeChangeDelayHours, 72);
  // V2Constants.sol:80 EXERCISE_FEE_MAX_PAYOUT_SHARE_BPS = 1000 @ d01d3c58
  assert.equal(FEES_V2.exercisePayoutCapBps, 1_000);
  // tier1.json v2.fees @ callhouse e7dc2345: premiumFeeBps 500 (under PREMIUM_FEE_CEIL_BPS 1000), resaleFeeBps 0,
  // takerFeeFlat "100000", takerFeeCapBps 1000, exerciseFeeBps 25, mintFeePpm 0
  assert.equal(FEES_V2.premiumBps, 500);
  assert.ok(FEES_V2.premiumBps <= 1_000, "premiumBps must sit under PREMIUM_FEE_CEIL_BPS");
  assert.equal(FEES_V2.resalePremiumBps, 0);
  assert.equal(FEES_V2.takerFlatRaw, 100_000n);
  assert.equal(FEES_V2.takerCapBps, 1_000);
  assert.equal(FEES_V2.exerciseBps, 25);
  assert.equal(FEES_V2.writerCollateralRatePpm, 0);
});

/*
 * T-OP-105. The how-it-works page announced "The approved expansion targets 20 markets … the other 14 registry
 * markets are deferred"; the owner ruling of 2026-09-21 (root AGENTS.md "LAUNCH WITH NVDA AND SPCX ONLY") and the
 * registry's authoritative `launchSet.markets` block (callhouse ops/markets/tier1.json at
 * e09af8aaed8e1f9a29aaf82f010c652ee1085050) say two. LAUNCH_SET is hand-mirrored (the projection generator does not
 * render launchSet yet), so this pin is what makes drift loud; the expected list is copied on purpose.
 */
test("LAUNCH_SET mirrors the registry launchSet block: NVDA and SPCX, in that order, and nothing else", () => {
  assert.deepEqual([...LAUNCH_SET], ["NVDA", "SPCX"]);
  assert.equal(listTickers(LAUNCH_SET), "NVDA and SPCX");
  assert.equal(listTickers(["A"]), "A");
  assert.equal(listTickers(["A", "B", "C"]), "A, B and C");
  assert.throws(() => listTickers([]), RangeError);
  assert.ok(REGISTRY_MARKET_COUNT > LAUNCH_SET.length, "the registry holds more rows than the launch set");
});

test("the how-it-works launch sentences render from LAUNCH_SET: no literal count, ticker, 'deferred' or 'wave' in JSX", () => {
  const src = readFileSync(new URL("../app/how-it-works/page.tsx", import.meta.url), "utf8");
  assert.ok(/LAUNCH_SET\.length/.test(src) && /listTickers\(LAUNCH_SET\)/.test(src), "the page must render the launch size and tickers from LAUNCH_SET");
  assert.ok(/REGISTRY_MARKET_COUNT - LAUNCH_SET\.length/.test(src), "the not-in-launch count must be derived, not typed");
  // The retired claims, and the literal tickers a hand edit would reintroduce.
  for (const literal of ["20 markets", "14 registry", "deferred", "expansion targets", "NVDA", "SPCX", "wave"]) {
    assert.equal(src.includes(literal), false, `app/how-it-works/page.tsx must not contain the literal ${JSON.stringify(literal)}`);
  }
});
