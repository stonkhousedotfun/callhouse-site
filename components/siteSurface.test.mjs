import test from "node:test";

import { assertSiteSurface, readSiteSurface } from "./siteSurface.mjs";

test("favicon, Open Graph alt and standing footer disclosures remain present", () => {
  assertSiteSurface(readSiteSurface());
});
