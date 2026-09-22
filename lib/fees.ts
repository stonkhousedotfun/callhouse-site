/** Fee display and conversion bounds for the site's labelled v8 illustrations. */
export function writerCollateralHeadline(ppm: number): string {
  if (!Number.isSafeInteger(ppm) || ppm < 0 || ppm > 5_000) throw new RangeError("Invalid writer collateral rate");
  return ppm === 0 ? "0 at launch" : `${ppm} ppm`;
}

export function takerFeeCapHeadline(raw: bigint): string {
  if (raw < 0n) throw new RangeError("Invalid taker fee cap");
  const fraction = (raw % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "").padEnd(2, "0");
  return `${raw / 1_000_000n}.${fraction} USDG cap`;
}

/** Clearinghouse._conversionFloor: route fee <= 100 bps, combined loss <= 300 bps. */
export function conversionFloorBps(maxSlippageBps: number, routeFeeBps: number): number {
  if (![maxSlippageBps, routeFeeBps].every((rate) => Number.isSafeInteger(rate) && rate >= 0) || maxSlippageBps > 300) {
    throw new RangeError("Invalid conversion bounds");
  }
  return 10_000 - Math.min(300, maxSlippageBps + Math.min(100, routeFeeBps));
}
