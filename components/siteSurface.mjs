import { existsSync, readFileSync } from "node:fs";

export function readSiteSurface() {
  const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const iconPath = new URL("../app/icon.svg", import.meta.url);
  return {
    icon: existsSync(iconPath) ? read("app/icon.svg") : "",
    image: read("app/opengraph-image.tsx"),
    footer: read("components/Footer.tsx"),
    layout: read("app/layout.tsx"),
  };
}

/** Positive assertions for metadata and site-wide disclosures that copy-lint does not cover. */
export function assertSiteSurface({ icon, image, footer, layout }) {
  if (!/<svg\b/.test(icon)) throw new Error("Site favicon is missing");

  const imageCode = image.replace(/\/\*[\s\S]*?\*\//g, "");
  const alt = imageCode.match(/export const alt\s*=\s*(["'`])([^"'`]+)\1/);
  if (!alt?.[2]?.trim()) throw new Error("Open Graph image alt text is missing");

  const footerCode = footer.replace(/\/\*[\s\S]*?\*\//g, "");
  const paragraphs = [...footerCode.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((match) => match[1]);
  if (!paragraphs.some((paragraph) =>
    paragraph.includes("Not available to US persons") &&
    paragraph.includes("Not affiliated with Robinhood Markets") &&
    paragraph.includes("Nothing here is financial advice or an offer of securities")
  )) throw new Error("Standing footer disclosures are missing");
  if (!paragraphs.some((paragraph) => paragraph.includes("STATUS.auditLine"))) {
    throw new Error("Standing footer audit status is missing");
  }
  if (!/<Footer\s*\/>/.test(layout)) throw new Error("Standing footer is not rendered");
}
