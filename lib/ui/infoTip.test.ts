/**
 * lib/ui/infoTip.ts, the twin of callhouse web/lib/ui/infoTip.ts (ported to the site for the
 * InfoTip twin the PayoffChart twin now uses): when the "?" opens. The rule is "over it for more than 1
 * second"; the rest (tap, keyboard, Escape) is what makes that usable on a phone and without a mouse. This package runs
 * node:test, so the app's infoTip.test.ts is ported onto node:assert and node:test's mock timers, case for case, still
 * through the controller's default (real setTimeout) wiring, not a stand-in scheduler.
 */
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";

import { INFO_TIP_DELAY_MS, createInfoTipController } from "./infoTip.ts";

let changes: boolean[];
const make = () => createInfoTipController((open) => changes.push(open));

beforeEach(() => { mock.timers.enable({ apis: ["setTimeout"] }); changes = []; });
afterEach(() => { mock.timers.reset(); });

describe("hover", () => {
  it("opens only after the pointer has rested for 1 second", () => {
    assert.equal(INFO_TIP_DELAY_MS, 1000);
    const t = make();
    t.pointerEnter("mouse");
    mock.timers.tick(999);
    assert.equal(t.isOpen(), false);
    mock.timers.tick(1);
    assert.equal(t.isOpen(), true);
    assert.deepEqual(changes, [true]);
  });

  it("is cancelled when the pointer leaves first", () => {
    const t = make();
    t.pointerEnter("mouse");
    mock.timers.tick(600);
    t.pointerLeave("mouse");
    mock.timers.tick(5000);
    assert.equal(t.isOpen(), false);
    assert.deepEqual(changes, []);
  });

  it("closes when the pointer leaves after it opened", () => {
    const t = make();
    t.pointerEnter("pen");
    mock.timers.tick(1000);
    t.pointerLeave("pen");
    assert.deepEqual(changes, [true, false]);
  });

  it("a second enter while waiting does not restart or double the timer", () => {
    const t = make();
    t.pointerEnter("mouse");
    mock.timers.tick(700);
    t.pointerEnter("mouse");
    mock.timers.tick(300);
    assert.equal(t.isOpen(), true);
    assert.deepEqual(changes, [true]);
  });
});

describe("tap", () => {
  it("toggles at once, and a finger never starts the hover timer", () => {
    const t = make();
    t.pointerEnter("touch");
    mock.timers.tick(2000);
    assert.equal(t.isOpen(), false);
    t.press();
    assert.equal(t.isOpen(), true);
    t.pointerLeave("touch");
    assert.equal(t.isOpen(), true);
    t.press();
    assert.equal(t.isOpen(), false);
    assert.deepEqual(changes, [true, false]);
  });

  it("a click during the hover wait opens now and the timer does not fire a second change", () => {
    const t = make();
    t.pointerEnter("mouse");
    t.press();
    mock.timers.tick(2000);
    assert.deepEqual(changes, [true]);
    t.pointerLeave("mouse");
    assert.equal(t.isOpen(), true);
  });
});

describe("keyboard", () => {
  it("keyboard focus opens at once; focus that came with a press does not", () => {
    const k = make();
    k.focus(true);
    assert.equal(k.isOpen(), true);
    const p = make();
    p.focus(false);
    assert.equal(p.isOpen(), false);
  });

  it("Escape closes it and cancels a pending hover", () => {
    const t = make();
    t.focus(true);
    t.escape();
    assert.equal(t.isOpen(), false);
    t.pointerEnter("mouse");
    mock.timers.tick(500);
    t.escape();
    mock.timers.tick(1000);
    assert.equal(t.isOpen(), false);
    assert.deepEqual(changes, [true, false]);
  });

  it("blur closes it", () => {
    const t = make();
    t.press();
    t.blur();
    assert.deepEqual(changes, [true, false]);
  });
});

it("dispose clears a pending hover, so an unmounted tip never calls back", () => {
  const t = make();
  t.pointerEnter("mouse");
  t.dispose();
  mock.timers.tick(2000);
  assert.deepEqual(changes, []);
});
