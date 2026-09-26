/**
 * lib/numberFormat.ts, the twin of callhouse web/lib/numberFormat.ts (ported to the site because
 * the PayoffChart twin prints its "Now" price with displayPrice and withDollar). This package runs node:test, not
 * vitest, so the app's numberFormat.test.ts is ported onto node:assert: the cases are the app's, value for value.
 * Every expectation is a literal typed from the display rules ("$12 not $12.00", "$1.2M, 12.5K", "<$0.01", at most 4
 * decimals on shares, 1 on percentages, never "0.000000"), not a value read back from the code under test.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMPACT_FROM, displayExact, displayMoney, displayPercent, displayPrice, displayQuantity, displayRatioPercent, withDollar,
} from "./numberFormat.ts";

const usdg = (text: string): bigint => {
  const [w, f = ""] = text.split(".");
  return BigInt(w) * 1_000_000n + BigInt((f + "000000").slice(0, 6));
};
const e18 = (text: string): bigint => {
  const [w, f = ""] = text.split(".");
  return BigInt(w) * 10n ** 18n + BigInt((f + "0".repeat(18)).slice(0, 18));
};

describe("money: at most 2 decimals, none when whole", () => {
  it("drops the cents only when they are zero", () => {
    assert.equal(displayMoney(usdg("12"), 6), "12");
    assert.equal(displayMoney(usdg("12.3"), 6), "12.30");
    assert.equal(displayMoney(usdg("12.345678"), 6), "12.34");
    assert.equal(displayMoney(usdg("0.05"), 6), "0.05");
    assert.equal(displayMoney(usdg("9999.99"), 6), "9,999.99");
    assert.equal(displayMoney(0n, 6), "0");
  });

  it("is compact from 10,000: K, M, B, one decimal, truncated", () => {
    assert.equal(COMPACT_FROM, 10_000n);
    assert.equal(displayMoney(usdg("10000"), 6), "10K");
    assert.equal(displayMoney(usdg("12549.99"), 6), "12.5K");
    assert.equal(displayMoney(usdg("250000"), 6), "250K");
    assert.equal(displayMoney(usdg("999999.99"), 6), "999.9K");
    assert.equal(displayMoney(usdg("1250000"), 6), "1.2M");
    assert.equal(displayMoney(usdg("3000000000"), 6), "3B");
  });

  it("shows a tiny amount as <0.01, never zeros and never 0", () => {
    assert.equal(displayMoney(1n, 6), "<0.01");
    assert.equal(displayMoney(usdg("0.009999"), 6), "<0.01");
    assert.equal(displayMoney(-1n, 6), "-<0.01");
  });

  it("with more decimals for a per-share figure: trailing zeros go, the cents stay", () => {
    assert.equal(displayMoney(usdg("0.04332"), 6, { maxDecimals: 6 }), "0.04332");
    assert.equal(displayMoney(usdg("1.5"), 6, { maxDecimals: 6 }), "1.50");
    assert.equal(displayMoney(usdg("7"), 6, { maxDecimals: 6 }), "7");
    assert.equal(displayMoney(usdg("0.000123"), 6, { maxDecimals: 6 }), "0.000123");
    assert.equal(displayMoney(usdg("0.00005"), 6, { maxDecimals: 6 }), "<0.0001");
    assert.equal(displayMoney(1n, 6, { maxDecimals: 6 }), "<0.0001");
  });

  it("keeps the sign, with the caller's minus", () => {
    assert.equal(displayMoney(-usdg("12.5"), 6), "-12.50");
    assert.equal(displayMoney(-usdg("25000"), 6, { minus: "−" }), "−25K");
  });
});

describe("price: 2 decimals where prices are compared", () => {
  it("keeps 2 decimals at 1 and up, whole or not, and never compacts", () => {
    assert.equal(displayPrice(usdg("12"), 6), "12.00");
    assert.equal(displayPrice(usdg("11.95"), 6), "11.95");
    assert.equal(displayPrice(usdg("123456.789"), 6), "123,456.78");
  });

  it("shows 3 significant digits under 1, at least 2 decimals, and <0.0001 below", () => {
    assert.equal(displayPrice(usdg("0.5"), 6), "0.50");
    assert.equal(displayPrice(usdg("0.012345"), 6), "0.0123");
    assert.equal(displayPrice(usdg("0.000123"), 6), "0.000123");
    assert.equal(displayPrice(e18("0.00001"), 18), "<0.0001");
    assert.equal(displayPrice(0n, 6), "0.00");
  });
});

describe("quantity: shares and units, at most 4 decimals", () => {
  it("drops trailing zeros and truncates", () => {
    assert.equal(displayQuantity(e18("1"), 18), "1");
    assert.equal(displayQuantity(e18("2.5"), 18), "2.5");
    assert.equal(displayQuantity(e18("0.123456"), 18), "0.1234");
    assert.equal(displayQuantity(e18("0.0012"), 18), "0.0012");
    assert.equal(displayQuantity(e18("12345.6789"), 18), "12.3K");
    assert.equal(displayQuantity(0n, 18), "0");
  });

  it("shows below one step as <0.0001", () => {
    assert.equal(displayQuantity(1n, 18), "<0.0001");
    assert.equal(displayQuantity(e18("0.00009"), 18), "<0.0001");
  });
});

describe("percent: at most 1 decimal", () => {
  it("from a ratio, exactly", () => {
    assert.equal(displayRatioPercent(1n, 4n), "25%");
    assert.equal(displayRatioPercent(125n, 1000n), "12.5%");
    assert.equal(displayRatioPercent(1234n, 10000n), "12.3%");
    assert.equal(displayRatioPercent(0n, 7n), "0%");
    assert.equal(displayRatioPercent(1n, 100_000n), "<0.1%");
    assert.equal(displayRatioPercent(-1n, 8n), "-12.5%");
    assert.throws(() => displayRatioPercent(1n, 0n), RangeError);
  });

  it("from a number, without a float truncating 2.3 to 2.2", () => {
    assert.equal(displayPercent(2.3), "2.3%");
    assert.equal(displayPercent(12.34), "12.3%");
    assert.equal(displayPercent(40), "40%");
    assert.equal(displayPercent(0.04), "<0.1%");
    assert.equal(displayPercent(Number.NaN), "—");
  });
});

describe("never a run of zeros", () => {
  it("no rule prints 0.000000 or a trailing .00 on money", () => {
    const outs = [
      displayMoney(0n, 6), displayMoney(1n, 6), displayMoney(usdg("5"), 6), displayMoney(1n, 6, { maxDecimals: 6 }),
      displayQuantity(0n, 18), displayQuantity(1n, 18), displayQuantity(e18("3"), 18),
      displayPrice(1n, 18), displayRatioPercent(0n, 1n), displayRatioPercent(1n, 10n ** 9n),
    ];
    for (const o of outs) {
      assert.doesNotMatch(o, /0\.0{4,}/);
      assert.doesNotMatch(o, /\.0+$/);
    }
  });
});

describe("exact: every digit, no zero tail", () => {
  it("keeps every significant digit and at least the cents, with no floor and no compaction", () => {
    assert.equal(displayExact(usdg("3"), 6), "3.00");
    assert.equal(displayExact(usdg("222.5"), 6), "222.50");
    assert.equal(displayExact(usdg("0.123456"), 6), "0.123456");
    assert.equal(displayExact(1n, 6), "0.000001");
    assert.equal(displayExact(usdg("1234567.8901"), 6), "1,234,567.8901");
    assert.equal(displayExact(-usdg("3"), 6), "-3.00");
    assert.equal(displayExact(0n, 6), "0.00");
    assert.equal(displayExact(e18("2.5"), 18, { minDecimals: 0 }), "2.5");
  });
});

describe("withDollar", () => {
  it("puts the $ after the sign and the <", () => {
    assert.equal(withDollar("12"), "$12");
    assert.equal(withDollar("<0.01"), "<$0.01");
    assert.equal(withDollar("-5"), "-$5");
    assert.equal(withDollar("−<0.01"), "−<$0.01");
    assert.equal(withDollar("1.2M"), "$1.2M");
    assert.equal(withDollar("—"), "—");
  });
});
