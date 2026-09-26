import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { takerFeeCapHeadline, writerCollateralHeadline } from "./fees.ts";
import { cardsAvailability } from "./live.ts";
import { breakeven, costToBuy, payoutAt, takerFee } from "./payoff.ts";
import { mintRent, writerCapacity, writerCollateralNeed } from "./rent.ts";
import { ADDRESSES, FEES_V2, LAUNCH_SET, LISTED_EXPIRIES, REGISTRY_MARKET_COUNT, V8_ADDRESSES, V8_DEPLOY_BLOCK, V8_UNVERIFIED, V8_VERIFIED, delayHours, feePct, listedExpiriesSentence, listTickers, type AddressRow } from "./site.ts";

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

// The five v7 addresses removed from lib/site.ts when the site moved to v8. A v8 row must never reuse one.
const REMOVED_V7_ADDRESSES = [
  "0x22dEf851cD1a3B04Ad7d232bE786d76E6944d424",
  "0x9fcAe743C3fA0aEC7DB9b1d01e86464b85759942",
  "0xb205984b5F2F9010c2bD8aCA46d946Fe1c4F2A54",
  "0xd0fCeD9Ee6F533aA900BEe8d0523eF4867a5784a",
  "0xf529CE3708bd2002D6bC974dFC0501c92aE72c30",
] as const;

// The nine v8 addresses the v9 launch retired (lib/site.ts and the callhouse registry before the launch). The
// site lists the live deployment only; a row must never show one of these again.
const RETIRED_V8_ADDRESSES = [
  "0x1A67948175DFf13426F0d61bfB483579D2ff2EeE",
  "0x65A97a05e9726DA45794DA206943bbc4280b5ce6",
  "0x0e4F266b73e95dc6d4cA10674DCd5eF353e2BDCD",
  "0x5d0D98C6774B5db0b83D8Bc16FDd09a8Df826d18",
  "0x6d97634501b52D78c8dEb77a7d9105587DBAAf18",
  "0xfb5CcB9CF9249E46D8Af0C4f8fe7Eaa9bD7BfF51",
  "0x53eF3ff548Fe3EaA1A1c0a0E010ED0aBB5365201",
  "0xf7d21652473014d1Ca0e22FF75420494cdd09164",
  "0xb663C1EAEeD4664515Cc864667263f3e75238da3",
] as const;

test("no address row shows a contract the v9 launch retired", () => {
  const retired = new Set(RETIRED_V8_ADDRESSES.map((a) => a.toLowerCase()));
  for (const [key, row] of Object.entries({ ...ADDRESSES, ...V8_ADDRESSES })) {
    assert.equal(retired.has(row.address.toLowerCase()), false, `${key} shows the retired v8 contract ${row.address}`);
  }
});

// Where each V8_ADDRESSES row is copied from in callhouse ops/markets/tier1.json.
const V8_REGISTRY_SOURCE: Record<keyof typeof V8_ADDRESSES, (registry: any) => unknown> = {
  v8Clearinghouse: (r) => r.v2.contracts.clearinghouse,
  v8OrderBook: (r) => r.v2.contracts.orderBook,
  v8SettlementOracle: (r) => r.v2.contracts.settlementOracle,
  v8ExpiryCalendar: (r) => r.v2.contracts.expiryCalendar,
  v8PayoutAdapter: (r) => r.v2.contracts.payoutAdapter,
  v8HouseVaultNvda: (r) => r.markets.find((m: any) => m.ticker === "NVDA")?.v2.houseVault,
  v8HouseVaultSpcx: (r) => r.markets.find((m: any) => m.ticker === "SPCX")?.v2.houseVault,
  v8EarnVault: (r) => r.v2.contracts.earnVault,
  v8AccessManager: (r) => r.v2.contracts.accessManager,
};

test("v8 address rows are well-formed, distinct and never a removed v7 or a v1 address", () => {
  const rows = Object.entries(V8_ADDRESSES);
  assert.ok(rows.length > 0);
  const seen = new Set<string>();
  const v1 = new Set(Object.values(ADDRESSES).map((row) => row.address.toLowerCase()));
  const v7 = new Set(REMOVED_V7_ADDRESSES.map((a) => a.toLowerCase()));
  for (const [key, row] of rows) {
    assert.match(key, /^v8[A-Z]/, `${key} must carry the v8 prefix`);
    assert.match(row.address, /^0x[0-9a-fA-F]{40}$/, `${key} address`);
    assert.notEqual(row.address.toLowerCase(), row.address, `${key} must be the mixed-case checksummed form`);
    assert.notEqual(BigInt(row.address), 0n, `${key} is the zero address`);
    const lower = row.address.toLowerCase();
    assert.equal(seen.has(lower), false, `${key} duplicates another v8 row`);
    seen.add(lower);
    assert.equal(v7.has(lower), false, `${key} reuses a removed v7 address`);
    assert.equal(v1.has(lower), false, `${key} reuses a v1 or token address`);
    assert.ok(row.what.length > 0 && !/\brent\b/i.test(row.what + row.label), `${key} copy`);
  }
  assert.deepEqual(Object.keys(V8_REGISTRY_SOURCE).sort(), Object.keys(V8_ADDRESSES).sort());
  assert.equal(V8_DEPLOY_BLOCK, 72_462_898);
});

test("v8 address rows equal the callhouse registry write-back", {
  skip: !process.env.CALLHOUSE_WEB_DIR && "set CALLHOUSE_WEB_DIR for the cross-repository property",
}, () => {
  // Same source as lib/live.test.mts: the registry on callhouse's v8 branch, not whatever the checkout has on disk.
  const registry = JSON.parse(execFileSync("git", ["-C", resolve(process.env.CALLHOUSE_WEB_DIR!, ".."),
    "show", "v8:ops/markets/tier1.json"], { encoding: "utf8" }));
  assert.equal(registry.v2.deployBlock, V8_DEPLOY_BLOCK);
  for (const [key, source] of Object.entries(V8_REGISTRY_SOURCE)) {
    assert.equal(V8_ADDRESSES[key as keyof typeof V8_ADDRESSES].address, source(registry), `${key} vs registry`);
  }
});

// The rows whose source the explorer verified. Etherscan V2 `getsourcecode` (chain 4663) was asked about every
// V8_ADDRESSES row of the v9 deployment at 2026-09-25 6:48 PM PT: only the AccessManager returned source (the v8
// Clearinghouse at 0x1A67...2EeE returned its source in the same run, the positive control). Add a key only after the
// explorer returns the contract's source.
const V8_EXPLORER_VERIFIED: ReadonlySet<string> = new Set([
  "v8AccessManager",
]);

test("only explorer-verified v8 rows drop the not-verified notice, and each links to its verified source", () => {
  for (const key of V8_EXPLORER_VERIFIED) assert.ok(Object.hasOwn(V8_ADDRESSES, key), `${key} is not a V8_ADDRESSES row`);
  for (const [key, entry] of Object.entries(V8_ADDRESSES)) {
    const row: AddressRow = entry;
    if (V8_EXPLORER_VERIFIED.has(key)) {
      assert.equal(row.verified, V8_VERIFIED, `${key} is verified on the explorer`);
      assert.equal(row.sourceUrl, `https://robin.etherscan.io/address/${row.address}#code`, `${key} links to its own verified source`);
    } else {
      assert.equal(row.verified, V8_UNVERIFIED, `${key} is not verified on the explorer and must keep the notice`);
      assert.equal(row.sourceUrl, undefined, `${key} is not verified on the explorer and must not link to a source`);
    }
  }
});

test("the how-it-works contracts section shows each row's source link or its notice", () => {
  const src = readFileSync(new URL("../app/how-it-works/page.tsx", import.meta.url), "utf8");
  assert.ok(/row\.sourceUrl \? <ExternalLink href=\{row\.sourceUrl\}/.test(src), "a verified row links to row.sourceUrl");
  assert.ok(/: row\.verified \? <p[^>]*>\{row\.verified\}<\/p>/.test(src), "an unverified row renders its notice");
  assert.equal(src.includes("They are not source-verified on the explorer yet"), false, "the all-unverified sentence is retired");
});

test("the how-it-works contracts section renders USDG and every v8 row", () => {
  const src = readFileSync(new URL("../app/how-it-works/page.tsx", import.meta.url), "utf8");
  assert.ok(/ADDRESSES\.usdg,\s*\.\.\.Object\.values\(V8_ADDRESSES\)/.test(src), "CONTRACTS must list USDG then every V8_ADDRESSES row");
  assert.equal(src.includes("will be published after deployment"), false, "the pre-deploy sentence is retired");
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

test("the displayed fee headlines derive from FEES_V2", () => {
  // The unused FeeSlip component (imported nowhere) was deleted with its "replacement design" copy, so its
  // headline check went with it; the how-it-works headlines are still bound to FEES_V2.
  const page = readFileSync(new URL("../app/how-it-works/page.tsx", import.meta.url), "utf8");
  assert.ok(/<dt className="font-bold">Writer collateral charge<\/dt><dd[^>]*>\{writerCollateralHeadline\(FEES_V2\.writerCollateralRatePpm\)\}<\/dd>/.test(page), "page writer headline must bind FEES_V2");
  assert.ok(/<dt className="font-bold">Taker fee<\/dt><dd[^>]*>\{takerFeeCapHeadline\(FEES_V2\.takerFlatRaw\)\}<\/dd>/.test(page), "page taker headline must bind FEES_V2");
  assert.equal(writerCollateralHeadline(FEES_V2.writerCollateralRatePpm),
    FEES_V2.writerCollateralRatePpm === 0 ? "0 at launch" : `${FEES_V2.writerCollateralRatePpm} ppm`);
  assert.equal(takerFeeCapHeadline(FEES_V2.takerFlatRaw),
    `${(Number(FEES_V2.takerFlatRaw) / 1_000_000).toFixed(2)} USDG cap`);
});

test("unavailable live card feed is not an empty valid book on screen", () => {
  // The "not available yet" panel was removed: an unavailable (null) or empty feed now
  // renders no contracts section at all, so neither can be shown as a valid empty book.
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.ok(/\{cards && cards\.length > 0 \? <Section id="contracts"/.test(page), "the contracts section must render only for a non-empty validated feed");
  assert.equal(cardsAvailability(null), "unavailable");
  assert.equal(cardsAvailability([]), "empty");
});

/*
 * The fee prose on /terms, /legal and /how-it-works used to be hand-typed beside
 * FEES_V2, and once copy-lint was removed nothing bound the
 * two. These tests are that binding: (1) the formatters render the sentences exactly as they read before,
 * (2) the three page sources contain no literal fee figure and reference FEES_V2 through the formatters,
 * (3) FEES_V2 mirrors the contract constants it discloses. The expected values in (3) are HAND-COPIED on
 * purpose — the test's job is to make drift loud — and each names the constant and file it mirrors:
 *   callhouse-contracts:
 *     src/v2/interfaces/V2Constants.sol:60  FEE_CHANGE_DELAY = 48 hours          (OrderBook.setFeeParams window)
 *     src/v2/access/V8Roles.sol:116         MARKET_FEE_MANAGER_DELAY = 72 hours  (setMarketFees: exercise fee + collateral rate)
 *     src/v2/interfaces/V2Constants.sol:80  EXERCISE_FEE_MAX_PAYOUT_SHARE_BPS = 1000
 *     src/v2/interfaces/V2Constants.sol:75  PREMIUM_FEE_CEIL_BPS = 1000          (ceiling the 500 below must sit under)
 *   callhouse ops/markets/tier1.json `v2.fees` (the launch values
 *   DeployV8 reads through V2_PREMIUM_FEE_BPS etc., V2DeployBase.sol:391-397):
 *     premiumFeeBps 500, resaleFeeBps 0, takerFeeFlat "100000", takerFeeCapBps 1000, exerciseFeeBps 25, mintFeePpm 0
 * The 72 h the two legal pages state is the MARKET-fee lane (collateral rate and exercise fee, pinned per series),
 * not the 48 h general fee-change delay; both live in FEES_V2 and the prose cites the right one.
 */
test("fee prose formatters render the disclosure figures exactly as the pages state them, and refuse bad input", () => {
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
  // V2Constants.sol:60 FEE_CHANGE_DELAY = 48 hours
  assert.equal(FEES_V2.feeChangeDelayHours, 48);
  // V8Roles.sol:116 MARKET_FEE_MANAGER_DELAY = 72 hours
  assert.equal(FEES_V2.marketFeeChangeDelayHours, 72);
  // V2Constants.sol:80 EXERCISE_FEE_MAX_PAYOUT_SHARE_BPS = 1000
  assert.equal(FEES_V2.exercisePayoutCapBps, 1_000);
  // tier1.json v2.fees: premiumFeeBps 500 (under PREMIUM_FEE_CEIL_BPS 1000), resaleFeeBps 0,
  // takerFeeFlat "100000", takerFeeCapBps 1000, exerciseFeeBps 25, mintFeePpm 0
  assert.equal(FEES_V2.premiumBps, 500);
  assert.ok(FEES_V2.premiumBps <= 1_000, "premiumBps must sit under PREMIUM_FEE_CEIL_BPS");
  assert.equal(FEES_V2.resalePremiumBps, 0);
  assert.equal(FEES_V2.takerFlatRaw, 100_000n);
  assert.equal(FEES_V2.takerCapBps, 1_000);
  assert.equal(FEES_V2.exerciseBps, 25);
  assert.equal(FEES_V2.writerCollateralRatePpm, 0);
  // tier1.json v2.fees makerRebateBps 5000, and the live v9 OrderBook feeParams()
  // answered 5000 on 2026-09-25. A rebate is a share of the taker fee, so it can never exceed BPS.
  assert.equal(FEES_V2.makerRebateBps, 5_000);
  assert.ok(FEES_V2.makerRebateBps <= 10_000, "makerRebateBps is a share of the taker fee");
});

/*
 * The how-it-works page announced "The approved expansion targets 20 markets … the other 14 registry
 * markets are deferred"; the launch is NVDA and SPCX only, as the registry's authoritative `launchSet.markets`
 * block (callhouse ops/markets/tier1.json) says.
 * LAUNCH_SET is hand-mirrored (the projection generator does not
 * render launchSet yet), so this pin is what makes drift loud; the expected list is copied on purpose.
 */
test("LAUNCH_SET mirrors the registry launchSet block: NVDA and SPCX, in that order, and nothing else", () => {
  assert.deepEqual([...LAUNCH_SET], ["NVDA", "SPCX"]);
  assert.equal(listTickers(LAUNCH_SET), "NVDA and SPCX");
  assert.equal(listTickers(["A"]), "A");
  assert.equal(listTickers(["A", "B", "C"]), "A, B and C");
  assert.throws(() => listTickers([]), RangeError);
  // The registry is exactly the launch set; this pin turned
  // from ">" (the 35-row registry) to "===" on purpose, so a row added back to the registry is red here first.
  assert.equal(REGISTRY_MARKET_COUNT, LAUNCH_SET.length, "the registry holds exactly the launch set");
});

/*
 * The registry decides which
 * closes each market lists; the site says so from LISTED_EXPIRIES. The expected sentence is copied on purpose, and the
 * cross-repository test below compares LISTED_EXPIRIES with the registry's effective values.
 */
test("LISTED_EXPIRIES covers the launch set: NVDA dailies Monday, Wednesday and Friday only, SPCX weeklies only", () => {
  assert.deepEqual(Object.keys(LISTED_EXPIRIES), [...LAUNCH_SET]);
  assert.equal(
    listedExpiriesSentence(),
    "NVDA lists daily options expiring Monday, Wednesday and Friday; SPCX lists weekly options only.",
  );
  const every = ["mon", "tue", "wed", "thu", "fri"] as const;
  assert.equal(listedExpiriesSentence(["A"], { A: { expiriesAhead: { weekly: 0, daily: 6 }, dailyWeekdays: every } }),
    "A lists daily options expiring every trading day.");
  assert.equal(listedExpiriesSentence(["A"], { A: { expiriesAhead: { weekly: 1, daily: 3 }, dailyWeekdays: ["fri"] } }),
    "A lists daily options expiring Friday and weekly options.");
  assert.throws(() => listedExpiriesSentence(["A"], { A: { expiriesAhead: { weekly: 0, daily: 0 }, dailyWeekdays: every } }), RangeError);
  assert.throws(() => listedExpiriesSentence(["B"], {}), RangeError);
});

test("the FAQ and how-it-works render the listing days from listedExpiriesSentence, not typed weekdays", () => {
  for (const file of ["../app/faq/page.tsx", "../app/how-it-works/page.tsx"]) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8").replace(/\/\*\*[\s\S]*?\*\//, "");
    assert.ok(src.includes("{listedExpiriesSentence()}"), `${file} renders listedExpiriesSentence()`);
    for (const literal of ["Monday, Wednesday", "Tuesday", "Thursday", "Mon/Wed/Fri"]) {
      assert.equal(src.includes(literal), false, `${file} must not type the listing day ${JSON.stringify(literal)}`);
    }
  }
});

/*
 * The landing and its share image said "calls and puts", but the cranker lists put series only for a market
 * whose registry row has v2.puts true (callhouse keeper/src/v2/cranker/steps.ts ladderSlots), and NVDA and SPCX both
 * have v2.puts false. The pages now say calls; the second test turns red the day the registry lists puts, so the copy
 * is revisited then.
 */
test("the landing and its share image do not advertise puts the launch markets do not list", () => {
  for (const file of ["../app/page.tsx", "../app/opengraph-image.tsx"]) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.equal(/calls and puts/i.test(src), false, `${file} advertises puts`);
  }
  for (const file of ["../app/faq/page.tsx", "../app/how-it-works/page.tsx"]) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.ok(src.includes("{listTickers(LAUNCH_SET)} list calls only"), `${file} says the launch markets list calls only`);
  }
  const faq = readFileSync(new URL("../app/faq/page.tsx", import.meta.url), "utf8").replace(/\s+/g, " ");
  assert.ok(faq.includes("{listTickers(LAUNCH_SET)} have daily House vaults only"), "the FAQ says the launch vaults are daily");
});

test("every launch market has v2.puts false in the registry, as the pages say", {
  skip: !process.env.CALLHOUSE_WEB_DIR && "set CALLHOUSE_WEB_DIR for the cross-repository property",
}, () => {
  const registry = JSON.parse(execFileSync("git", ["-C", resolve(process.env.CALLHOUSE_WEB_DIR!, ".."),
    "show", "v8:ops/markets/tier1.json"], { encoding: "utf8" }));
  for (const ticker of LAUNCH_SET) {
    const v2 = registry.markets.find((m: any) => m.ticker === ticker)?.v2;
    assert.equal(v2?.puts, false, `${ticker} lists puts now: update the pages`);
    // The FAQ says the launch markets have daily House vaults only.
    assert.equal(v2?.house?.weekly, null, `${ticker} has a weekly House vault now: update the FAQ`);
    assert.match(String(v2?.house?.daily), /^0x[0-9a-fA-F]{40}$/, `${ticker} has no daily House vault`);
  }
});

test("LISTED_EXPIRIES equals each launch market's effective expiriesAhead and dailyWeekdays in the registry", {
  skip: !process.env.CALLHOUSE_WEB_DIR && "set CALLHOUSE_WEB_DIR for the cross-repository property",
}, () => {
  // Same source as the address test above: the registry on callhouse's v8 branch. Effective = v2.defaults with the
  // market's overrides on top, an object replacing only the keys it names and a list replacing the whole list
  // (callhouse keeper/src/v2/registry.ts, the strict parser).
  const registry = JSON.parse(execFileSync("git", ["-C", resolve(process.env.CALLHOUSE_WEB_DIR!, ".."),
    "show", "v8:ops/markets/tier1.json"], { encoding: "utf8" }));
  const defaults = registry.v2.defaults;
  for (const ticker of LAUNCH_SET) {
    const overrides = registry.markets.find((m: any) => m.ticker === ticker)?.v2.overrides;
    assert.ok(overrides, `${ticker} has v2.overrides in the registry`);
    assert.deepEqual(
      {
        expiriesAhead: { ...defaults.expiriesAhead, ...overrides.expiriesAhead },
        dailyWeekdays: overrides.dailyWeekdays ?? defaults.dailyWeekdays,
      },
      LISTED_EXPIRIES[ticker],
      `${ticker} vs registry`,
    );
  }
});

test("the how-it-works launch sentences render from LAUNCH_SET: no literal count, ticker, 'deferred' or 'wave' in JSX", () => {
  const src = readFileSync(new URL("../app/how-it-works/page.tsx", import.meta.url), "utf8");
  assert.ok(/LAUNCH_SET\.length/.test(src) && /listTickers\(LAUNCH_SET\)/.test(src), "the page must render the launch size and tickers from LAUNCH_SET");
  // The "other N registry markets are not part of the launch" sentence was removed (dead since the registry
  // became exactly the launch set, asserted above). Any registry count the page still prints
  // must come from REGISTRY_MARKET_COUNT, never a typed number.
  assert.ok(/REGISTRY_MARKET_COUNT/.test(src), "any registry count is derived from REGISTRY_MARKET_COUNT");
  assert.equal(src.includes("not part of the launch"), false, "the removed hedge sentence stays out");
  // The retired claims, and the literal tickers a hand edit would reintroduce.
  for (const literal of ["20 markets", "14 registry", "deferred", "expansion targets", "NVDA", "SPCX", "wave"]) {
    assert.equal(src.includes(literal), false, `app/how-it-works/page.tsx must not contain the literal ${JSON.stringify(literal)}`);
  }
});

/**
 * The FAQ answers withdrawal times for every user vault and how an option settles,
 * each from the contracts (sources listed in app/faq/page.tsx's header). These pin the parts a later edit could
 * quietly lose: the page is reachable, Earn's return is described as variable Morpho lending and never promised,
 * and the admin-resolve answer keeps the unbounded no-source case instead of implying a band always applies.
 */
test("the FAQ is linked from the nav, the footer and how-it-works", () => {
  for (const file of ["../components/NavLinks.tsx", "../components/Footer.tsx", "../app/how-it-works/page.tsx"]) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.ok(src.includes('href="/faq"') || src.includes('href: "/faq"'), `${file} links /faq`);
  }
});

test("the FAQ covers both user vaults and settlement, states Earn's return as variable Morpho lending, promises none", () => {
  const src = readFileSync(new URL("../app/faq/page.tsx", import.meta.url), "utf8");
  for (const id of ["earliest-withdrawal", "house-vault", "earn-vault", "the-close", "settlement-price", "payout"]) {
    assert.ok(src.includes(`id: "${id}"`), `section ${id}`);
  }
  assert.ok(/<strong>variable<\/strong>/.test(src) && src.includes("comes from Morpho lending"), "Earn's return is variable and from Morpho");
  assert.ok(src.includes("is not guaranteed") && src.includes("earns\n            nothing"), "no promise, and nothing earned without a venue");
  for (const promise of ["guaranteed return", "guaranteed yield", "risk-free", "APY of", "earn up to"]) {
    assert.equal(src.toLowerCase().includes(promise.toLowerCase()), false, `no yield promise: ${promise}`);
  }
  assert.ok(src.includes("the contract does not bound it"), "the unbounded admin resolve is disclosed");
  for (const literal of ["NVDA", "SPCX"]) {
    assert.equal(src.replace(/\/\*\*[\s\S]*?\*\//, "").includes(literal), false, `JSX renders tickers from LAUNCH_SET, not ${literal}`);
  }
});

/*
 * v9 no longer lets an administrator set an unbounded price on a close with no usable source
 * from 48 hours: SettlementOracle.adminResolve reverts NoSource unless the expiry is Held, and TooEarly before
 * expiry + 7 days (callhouse-contracts v9 SettlementOracle.sol:681-682, HELD_RESOLVE_DELAY :279). The pages
 * said "the team settles it by hand". Each of the three now names the hold and the week.
 */
test("a close with no usable price settles only after a guardian hold and a week, on every page that explains it", () => {
  for (const file of ["../app/faq/page.tsx", "../app/how-it-works/page.tsx", "../app/risks/page.tsx"]) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8").replace(/\s+/g, " ");
    assert.equal(src.includes("settles it by hand"), false, `${file} still says the team settles by hand`);
    assert.ok(/guardian has publicly held/.test(src), `${file} names the guardian hold`);
    assert.ok(/a week has passed|seven days after the close/.test(src), `${file} names the week`);
  }
});

/**
 * HouseVault refuses requestDeposit, cancelDepositRequest, requestWithdraw and
 * cancelWithdrawRequest from `epochEnd - SETTLEMENT_WINDOW` (1800 s) until the roll (_requireBeforeCutoff,
 * HouseVault.sol:1116-1124 in callhouse-contracts). The FAQ used to say withdrawals could be requested or
 * cancelled "at any time until the boundary is processed" and deposits "before the close"; a user who believed it
 * would be refused in the last half hour. The close is the vault's own epochEnd, so no time of day is typed.
 */
test("the FAQ's House answer closes requests and cancels 30 minutes before the close, with no time of day", () => {
  const jsx = readFileSync(new URL("../app/faq/page.tsx", import.meta.url), "utf8").replace(/\/\*\*[\s\S]*?\*\//, "");
  const start = jsx.indexOf("<DocSection {...FAQ_SECTIONS.house}>");
  const house = jsx.slice(start, jsx.indexOf("</DocSection>", start)).replace(/\s+/g, " ");
  assert.ok(start >= 0, "the House section renders");
  assert.ok(house.includes("Requests close <strong>30 minutes before the close</strong>"), "the cutoff is stated");
  assert.ok(house.includes("refuses new withdrawal and deposit requests and cancels of either"), "all four calls are refused");
  assert.ok(house.includes("until the boundary is processed"), "the refusal lasts until the roll");
  for (const stale of ["at any time until the boundary is processed", "must be requested (or cancelled) before the close"]) {
    assert.equal(house.includes(stale), false, `the pre-T-OP-925 claim ${JSON.stringify(stale)} is gone`);
  }
  assert.equal(/\d{1,2}:\d{2}|\b\d{1,2} ?(am|pm)\b/i.test(house), false, "no time of day: the close is the vault's own epochEnd");
});

/**
 * The same cutoff as the test above,
 * in the two answers that still promised the next close without it: "Earliest withdrawal" said a House
 * withdrawal is paid at "the next boundary", and the daily bullet said a request "during the day is priced at that day's
 * close". HouseVault refuses requestWithdraw from `epochEnd - SETTLEMENT_WINDOW` (1800 s) until the roll
 * (_requireBeforeCutoff, HouseVault.sol:1116-1124 in callhouse-contracts), so a request wanted inside the last
 * 30 minutes is made after the roll and paid at the close after. No time of day: the close is the vault's own epochEnd.
 */
test("the FAQ's Earliest and daily House answers skip a close inside its last 30 minutes, with no time of day", () => {
  const jsx = readFileSync(new URL("../app/faq/page.tsx", import.meta.url), "utf8").replace(/\/\*\*[\s\S]*?\*\//, "");
  const section = (name: string) => {
    const start = jsx.indexOf(`<DocSection {...FAQ_SECTIONS.${name}}>`);
    assert.ok(start >= 0, `the ${name} section renders`);
    return jsx.slice(start, jsx.indexOf("</DocSection>", start)).replace(/\s+/g, " ");
  };
  const earliest = section("earliest");
  assert.ok(earliest.includes("the close its epoch ends at, when you ask before requests close 30 minutes before it"), "the next close only before the cutoff");
  assert.ok(earliest.includes("Inside those last 30 minutes the vault takes no new requests"), "the cutoff refuses");
  assert.ok(earliest.includes("it is paid at the close after"), "inside the cutoff the earliest is the close after");
  assert.equal(earliest.includes("the close its epoch ends at. For Earn"), false, "the pre-T-OP-928 unqualified House answer is gone");
  const house = section("house");
  assert.ok(house.includes("during the day, up to 30 minutes before the close, is priced at that day&apos;s close"), "the daily line has the cutoff");
  assert.ok(house.includes("In the last 30 minutes the vault takes no new requests, so it waits for the next session&apos;s close"), "and what happens inside it");
  assert.equal(house.includes("during the day is priced at that day&apos;s close"), false, "the pre-T-OP-928 daily claim is gone");
  for (const [name, text] of [["earliest", earliest], ["house", house]]) {
    assert.equal(/\d{1,2}:\d{2}|\b\d{1,2} ?(am|pm)\b/i.test(text), false, `${name}: no time of day, the close is the vault's own epochEnd`);
  }
});
