"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { EXAMPLE_PAYOFF, EXAMPLE_POSITION, EXAMPLE_TAKE, formatUsdg } from "@/lib/examplePayoff";
import { multipleAt, payoutAt } from "@/lib/payoff";
import { CURVE_VIEW, buildPayoffCurve, clampPrice, keyboardPriceStep, priceAtRatio } from "@/lib/payoffCurve";

const SIX = 1_000_000n;
const position = EXAMPLE_POSITION;
const cost = EXAMPLE_TAKE.cost;
const spot = EXAMPLE_PAYOFF.spot;
const curve = buildPayoffCurve(spot, position, cost);
const TOUCH_DRAG_THRESHOLD = 8;

type TouchGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  axis: "pending" | "horizontal" | "vertical";
};

export function PayoffDemo() {
  const [price, setPrice] = useState<bigint>(spot);
  const touchGesture = useRef<TouchGesture | null>(null);
  const selected = clampPrice(price, curve.range);
  const point = curve.pointAt(selected);
  const payout = payoutAt(selected, position);
  const multiple = multipleAt(selected, position, cost);
  const instructionId = useId();
  const scenario = `If NVDA is $${formatUsdg(selected)} at expiry, this example's estimated settlement value is ${formatUsdg(payout)} USDG (${multiple?.toFixed(2) ?? "—"}×). You paid ${formatUsdg(cost)} USDG.`;

  function fromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const left = rect.left + rect.width * CURVE_VIEW.left / CURVE_VIEW.width;
    const width = rect.width * (CURVE_VIEW.width - CURVE_VIEW.left - CURVE_VIEW.right) / CURVE_VIEW.width;
    if (width > 0) setPrice(priceAtRatio((event.clientX - left) / width, curve.range));
  }
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    if (event.pointerType === "touch") {
      if (touchGesture.current) return;
      touchGesture.current = {
        pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, axis: "pending",
      };
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    fromPointer(event);
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch") {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event);
      return;
    }
    const gesture = touchGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId || gesture.axis === "vertical") return;
    if (gesture.axis === "pending") {
      const dx = Math.abs(event.clientX - gesture.startX);
      const dy = Math.abs(event.clientY - gesture.startY);
      if (Math.max(dx, dy) < TOUCH_DRAG_THRESHOLD) return;
      if (dy > dx * 1.5) { gesture.axis = "vertical"; return; }
      if (dx <= dy * 1.5) return;
      gesture.axis = "horizontal";
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    fromPointer(event);
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const gesture = touchGesture.current;
    if (event.pointerType === "touch" && gesture?.pointerId === event.pointerId) {
      const dx = Math.abs(event.clientX - gesture.startX);
      const dy = Math.abs(event.clientY - gesture.startY);
      if (gesture.axis === "horizontal" || (gesture.axis === "pending" &&
        (Math.max(dx, dy) < TOUCH_DRAG_THRESHOLD || dx > dy * 1.5))) fromPointer(event);
      touchGesture.current = null;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function onPointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (touchGesture.current?.pointerId === event.pointerId) touchGesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = keyboardPriceStep(curve.range);
    let next: bigint;
    switch (event.key) {
      case "ArrowRight": case "ArrowUp": next = selected + step; break;
      case "ArrowLeft": case "ArrowDown": next = selected - step; break;
      case "PageUp": next = selected + step * 10n; break;
      case "PageDown": next = selected - step * 10n; break;
      case "Home": next = curve.range.min; break;
      case "End": next = curve.range.max; break;
      default: return;
    }
    event.preventDefault();
    setPrice(clampPrice(next, curve.range));
  }

  return <div className="rounded-lg border border-line bg-surface p-5 sm:p-7">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="text-xl font-bold">Move the stock price</h3>
      <span className="text-sm font-semibold text-accent-text">Example · NVDA call · 1 share</span>
    </div>
    <p className="mt-2 text-sm text-ink-2">See how the same premium changes at expiry. This is an illustration, not a live quote.</p>
    <div className="relative mt-5 select-none">
      <svg viewBox={`0 0 ${CURVE_VIEW.width} ${CURVE_VIEW.height}`} className="block h-auto w-full" aria-hidden="true" focusable="false">
        <line x1={CURVE_VIEW.left} x2={CURVE_VIEW.width - CURVE_VIEW.right} y1={curve.zeroY} y2={curve.zeroY} stroke="var(--line-2)" strokeWidth="1.5" />
        <path d={curve.path} fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={point.x} x2={point.x} y1={CURVE_VIEW.top} y2={CURVE_VIEW.height - CURVE_VIEW.bottom} stroke="var(--accent)" strokeWidth="2" />
        <circle cx={point.x} cy={point.y} r="8" fill="var(--surface)" stroke="var(--accent)" strokeWidth="3" />
      </svg>
      {/* Keep page scrolling and pinch zoom; only horizontal drags and taps move the slider. */}
      <div role="slider" tabIndex={0} aria-label="Example NVDA price at expiry"
        aria-valuemin={Number(curve.range.min) / Number(SIX)} aria-valuemax={Number(curve.range.max) / Number(SIX)}
        aria-valuenow={Number(selected) / Number(SIX)} aria-valuetext={`${scenario} Max loss: ${formatUsdg(cost)} USDG.`}
        aria-describedby={instructionId}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onKeyDown}
        className="absolute inset-0 cursor-crosshair touch-pan-y touch-pinch-zoom rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" />
    </div>
    <div className="num flex justify-between gap-2 text-xs text-ink-3" aria-hidden="true"><span>${formatUsdg(curve.range.min)}</span><span>${formatUsdg(curve.range.max)}</span></div>
    <p className="mt-4 text-sm text-ink">{scenario}</p>
    <p className="mt-1 text-xs text-ink-3">Winning calls are owed Stock Tokens. USDG conversion may deliver less or fall back to tokens.</p>
    <p className="mt-1 text-sm font-semibold text-ink">Max loss: {formatUsdg(cost)} USDG.</p>
    <p id={instructionId} className="mt-2 text-xs text-ink-3">Drag or tap the curve, or use the arrow keys. Page Up and Down move faster.</p>
  </div>;
}
