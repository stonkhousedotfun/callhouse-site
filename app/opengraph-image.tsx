import { ImageResponse } from "next/og";

import { CHAIN_NAME, SITE_URL } from "@/lib/site";

/**
 * The Open Graph card for callhouse.finance: the image a link to this site unfurls into in Slack,
 * Telegram, X and iMessage. Next's app/opengraph-image file convention: exporting `alt`, `size`
 * and `contentType` alongside the default render is what makes Next emit the og:image tags, so
 * nothing imports this file and the layout needs no og.images entry.
 *
 * Rendered once at build time into a static PNG, in the Daylight look: the light ground, the brand
 * mark and wordmark, the landing headline, one plain line saying what the product is, the domain,
 * and the five-step week track as an ornament. No number appears on it, and that is the point: an
 * OG card is cached by every platform that scrapes it, sometimes for weeks, so any figure baked in
 * here would go stale somewhere we cannot reach, and a premium figure on a share card is exactly
 * the kind of claim scripts/copy-lint.mjs exists to keep off this domain. Live numbers live on
 * app.callhouse.finance.
 *
 * FONTS ARE BEST EFFORT, AND THE CARD NEVER FAILS THE BUILD OVER THEM. `loadFont` asks Google Fonts
 * for Schibsted Grotesk 800 and Figtree 500, subset to exactly the characters drawn below. The build
 * already reaches Google Fonts for next/font in app/layout.tsx, so this adds no new kind of
 * dependency. But if that request fails, times out or returns a format Satori cannot read, the card
 * renders with the face next/og bundles instead (Geist, regular weight only): plainer, still
 * correct. This card never fails the build over its fonts. The build as a whole does depend on
 * Google Fonts, through next/font in app/layout.tsx, which errors in a production build when the
 * faces cannot be fetched (see README).
 *
 * SATORI IS NOT A BROWSER. It implements a subset of flexbox and nothing else:
 *   - No CSS grid, no float, no position: absolute tricks beyond the basics, no CSS variables.
 *   - EVERY <div> with more than one child MUST carry an explicit `display: "flex"`. Omitting it is
 *     the single most common cause of a build failing here, and the message ("Expected <div> to
 *     have explicit display: flex or none") does not name the element. Every container below sets
 *     it, including ones with a single child, so that adding a sibling later cannot break the build.
 *   - Interpolated text is composed into a plain string before it is rendered (see `TAGLINE`),
 *     because a node with several adjacent text children hits the same rule.
 *   - Custom fonts REPLACE the bundled face rather than adding to it, so a character missing from
 *     the font subset renders as nothing. `GLYPHS_*` below are built from the very strings drawn.
 *
 * Colours are the LIGHT Daylight tokens from app/globals.css, written as literals because Satori
 * cannot read CSS variables. Do not introduce a value that is not a token there; this card and the
 * site it links to sit one click apart. The mark is BrandMark from components/ui/Brand.tsx on the
 * same 26 unit grid.
 *
 * Deliberately absent: a chart, a premium or strike figure, a logo or colour of Robinhood or Valorem
 * (we are not affiliated with either), a dark variant (platforms show one image to everyone) and a
 * per-route variant (every page shares one card).
 */

const GROUND = "#f5f8f6"; /* --ground */
const SURFACE = "#ffffff"; /* --surface */
const INK = "#0c1a15"; /* --ink */
const INK_2 = "#47584f"; /* --ink-2 */
const LINE = "#e0e8e3"; /* --line */
const LINE_2 = "#cfdbd4"; /* --line-2 */
const ACCENT = "#0a7f55"; /* --accent */
const ACCENT_INK = "#ffffff"; /* --accent-ink */

/** Satori resolves these names against the `fonts` array; with no fonts loaded it uses Geist. */
const DISPLAY = "Schibsted Grotesk";
const BODY = "Figtree";

/**
 * The bare host, so the card reads "callhouse.finance" rather than "https://callhouse.finance". Derived
 * from SITE_URL rather than hardcoded so a preview build labels itself honestly.
 */
const DOMAIN = SITE_URL.replace(/^https?:\/\//, "");

const WORDMARK = "callhouse";
const HEADLINE_LEAD = "Put your stocks to work,";
const HEADLINE_ACCENT = "one week at a time.";
/** Composed here, not interpolated in JSX: see the Satori notes above. */
const TAGLINE = `Covered calls on tokenised stocks · ${CHAIN_NAME}`;

/** Every character each face has to draw, so the Google Fonts subset cannot miss one. */
const GLYPHS_DISPLAY = unique(WORDMARK + HEADLINE_LEAD + HEADLINE_ACCENT);
const GLYPHS_BODY = unique(TAGLINE + DOMAIN);

/**
 * The landing page's five-step week, as dots: deposit, list, fill (the only moment a call is
 * written), close, claim. The two steps the vault itself acts on (list and fill) are filled in the
 * accent, as on the landing page.
 */
const TRACK: readonly boolean[] = [false, true, true, false, false];

export const alt =
  "Callhouse: Put your stocks to work, one week at a time. Covered calls on tokenised stocks on Robinhood Chain.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function unique(text: string): string {
  return Array.from(new Set(Array.from(text))).join("");
}

type LoadedFont = { name: string; data: ArrayBuffer; weight: 500 | 800; style: "normal" };

/**
 * One static weight of a Google font, subset to `text`, or null. Without a browser User-Agent the
 * css2 API answers with TrueType, which Satori reads; WOFF2, which it cannot, is refused rather
 * than passed through.
 */
async function loadFont(family: string, weight: 500 | 800, text: string): Promise<LoadedFont | null> {
  try {
    const query = `family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await fetch(`https://fonts.googleapis.com/css2?${query}`, {
      signal: AbortSignal.timeout(8000),
    }).then((res) => (res.ok ? res.text() : ""));
    const src = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
    if (!src) return null;
    const res = await fetch(src, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return { name: family, data: await res.arrayBuffer(), weight, style: "normal" };
  } catch {
    return null;
  }
}

/** BrandMark (components/ui/Brand.tsx), with its token classes resolved to the light values. */
function Mark({ size: px }: { size: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 26 26">
      <rect width="26" height="26" rx="8" fill={ACCENT} />
      <rect x="6" y="16.5" width="14" height="2.5" rx="1" fill={ACCENT_INK} />
      <path d="M7 15 12.04 8.7 14.68 11.58 19 6v1.98l-4.08 6.12-2.76-2.88L8.44 15Z" fill={ACCENT_INK} />
    </svg>
  );
}

export default async function OpengraphImage() {
  const [display, body] = await Promise.all([
    loadFont(DISPLAY, 800, GLYPHS_DISPLAY),
    loadFont(BODY, 500, GLYPHS_BODY),
  ]);
  // All or nothing. next/og treats any `fonts` array, even an empty one, as a full replacement for
  // its bundled face, so a half-loaded pair would leave one line of the card with no glyphs at all.
  const fonts = display && body ? [display, body] : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: GROUND,
          color: INK,
          padding: "64px 80px 58px",
          fontFamily: BODY,
        }}
      >
        {/* Top: the mark and the wordmark, as in the site's nav. */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Mark size={60} />
          <div
            style={{
              display: "flex",
              marginLeft: 18,
              fontFamily: DISPLAY,
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: -1.5,
              lineHeight: 1,
              color: INK,
            }}
          >
            {WORDMARK}
          </div>
        </div>

        {/* Middle: the landing headline, the second half in the accent, then the one plain line. */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontFamily: DISPLAY,
              fontSize: 86,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.04,
            }}
          >
            <div style={{ display: "flex", color: INK }}>{HEADLINE_LEAD}</div>
            <div style={{ display: "flex", color: ACCENT }}>{HEADLINE_ACCENT}</div>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              fontSize: 32,
              fontWeight: 500,
              lineHeight: 1.3,
              color: INK_2,
            }}
          >
            {TAGLINE}
          </div>
        </div>

        {/* Bottom: a hairline, the domain, and the five-step week track. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 26,
            borderTop: `2px solid ${LINE}`,
          }}
        >
          <div style={{ display: "flex", fontSize: 26, fontWeight: 500, color: INK_2 }}>{DOMAIN}</div>
          <div style={{ display: "flex", alignItems: "center" }}>
            {TRACK.map((key, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 ? (
                  <div style={{ display: "flex", width: 38, height: 2, background: LINE_2 }} />
                ) : null}
                <div
                  style={{
                    display: "flex",
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    background: key ? ACCENT : SURFACE,
                    border: `2px solid ${key ? ACCENT : LINE_2}`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
