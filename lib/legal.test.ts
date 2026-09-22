import assert from "node:assert/strict";
import test from "node:test";

import { securityTxtExpires } from "./legal.ts";

test("security.txt expiry rejects an impossible month and day", () => {
  assert.throws(() => securityTxtExpires("2026-13-45"), /must be a real date/);
});

test("security.txt expiry rejects a zeroed date", () => {
  assert.throws(() => securityTxtExpires("2026-00-00"), /must be a real date/);
});

test("security.txt expiry preserves valid and leap-day dates", () => {
  assert.equal(securityTxtExpires("2026-09-20"), "2027-09-20T00:00:00.000Z");
  assert.equal(securityTxtExpires("2028-02-29"), "2029-03-01T00:00:00.000Z");
  assert.throws(() => securityTxtExpires("Draft-2026-09-21"), /must be YYYY-MM-DD/);
});
