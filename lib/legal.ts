/**
 * The one place this package knows who operates it.
 *
 * Every "who is behind this" fact on /terms, /privacy, /legal#reporting and
 * /.well-known/security.txt reads from here and nowhere else. The values are the legal name of
 * the operating entity, where it is organised, which law governs the terms, and the three
 * contact addresses. As of 2026-09-12 NONE of them has been decided: no entity has been formed
 * or chosen, no counsel has named a governing law, and no mailbox exists for legal, privacy or
 * vulnerability reports. leekzor/callhouse: `ops/launch-legal.md` is the list of decisions that
 * fills these in.
 *
 * EVERY VALUE IS OPTIONAL AND NONE HAS A DEFAULT. `undefined` when unset, and the pages render
 * that as a visible gap in plain words ("not yet designated"). There is no placeholder name here
 * on purpose. A made-up entity, an "example.com" address or a guessed jurisdiction on a legal
 * page is a false statement of fact on the one page a regulator reads first, and it would also
 * hide the gap from us: a page that says "Stonkhouse Ltd" looks finished and is not. This product
 * publishes its unfilled weeks as "unfilled, 0"; the operator line gets the same treatment.
 *
 * These are NEXT_PUBLIC_*, so like everything in lib/site.ts they are INLINED AT BUILD TIME.
 * Setting them on the Railway service and restarting changes nothing; the site must be rebuilt,
 * and this repo's Dockerfile declares each one as a build ARG or the value would never reach
 * `next build` at all (README.md "Deploy"). leekzor/callhouse: `ops/launch-legal.md` walks
 * through the order.
 *
 * Deliberately absent: a postal address (counsel decides whether one must be published), a
 * company number, a DPO or EU/UK representative line (whether one is needed is a counsel
 * decision, not a constant), and any JSX. This is a lib file; the wording the pages render when
 * the gap is open is exported as a string below so both pages say exactly the same thing.
 */

/** Trim, and treat an empty or whitespace-only variable as unset rather than as a blank name. */
function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

/** Legal name of the entity operating this interface, exactly as it should appear on a page. */
export const OPERATOR_LEGAL_NAME = optional(process.env.NEXT_PUBLIC_OPERATOR_LEGAL_NAME);

/** Where that entity is organised, e.g. a country or a country and territory. Display only. */
export const OPERATOR_JURISDICTION = optional(process.env.NEXT_PUBLIC_OPERATOR_JURISDICTION);

/** The law the Terms of Use are governed by, as counsel words it. Rendered verbatim on /terms. */
export const GOVERNING_LAW = optional(process.env.NEXT_PUBLIC_GOVERNING_LAW);

/** Where a legal notice about the terms goes. */
export const LEGAL_CONTACT_EMAIL = optional(process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL);

/** Where a data-protection request goes. May equal LEGAL_CONTACT_EMAIL; it is a separate line so it can differ. */
export const PRIVACY_CONTACT_EMAIL = optional(process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL);

/**
 * Where a vulnerability report goes. Also the `Contact:` line of /.well-known/security.txt,
 * which is why that route returns 404 while this is unset: RFC 9116 makes Contact mandatory.
 */
export const SECURITY_CONTACT_EMAIL = optional(process.env.NEXT_PUBLIC_SECURITY_CONTACT_EMAIL);

/**
 * Version stamp of the legal documents, used to derive the `Expires:` line of security.txt and
 * cited on /terms and /privacy. A literal, not a clock: the same commit must build the same
 * bytes (see the note on CONTENT_REVISED in app/sitemap.ts). Bump it by hand, in the same commit
 * as the wording change. Format is `<state>-<YYYY-MM-DD>`; securityTxtExpires() below reads the
 * date part. A value starting "draft-" marks an unadopted draft and the pages mark themselves
 * from it (LEGAL_DOCS_ARE_DRAFT). v1 was adopted 2026-09-13 by the owner, reviewed against the
 * code, without counsel — leekzor/callhouse: `ops/launch-legal.md` §2 item 9. The copy-lint gate
 * that once pinned the draft prefix here was removed in the same commit as the adoption.
 * v2 (same day): one factual correction in the Terms' third-party clause — an oracle pause stops
 * writing and listing, not settlement; an issuer freeze can stop settlement.
 * v3 (2026-09-15): the product was renamed from Callhouse to Stonkhouse and its domains moved from
 * callhouse.finance to stonkhouse.fun. Both documents now name Stonkhouse, stonkhouse.fun and
 * app.stonkhouse.fun. Nothing else in either document changed. Like v2, published as a correction
 * to the adopted text, not as a draft.
 * v4 (2026-09-15): the v3 text plus factual corrections for the contracts redesign of 2026-09-13
 * (leekzor/callhouse-contracts README.md:5-15). The corrections were first drafted 2026-09-14 and
 * were never published on their own; they reached the live site only in v4, together with the
 * rename. Terms: the third-party venue and its registry key are gone from the third-party clause and
 * the affiliation line; the vault's own Valorem Clear instance, its fee switch on the admin key
 * (AUDIT-FINDINGS-2026-09-14 I-01) and the admin's value levers are stated; custody wording follows
 * write on fill; a refused fill and an unredeemed claim at the close are named. Privacy: the dapp's
 * only server route is now its own order feed (web/app/api/keeper/orders), which forwards nothing
 * from the request; the third-party listings recipient is removed. No change to what either domain
 * collects. Like v2 and v3, published as a correction to the adopted text, not as a draft;
 * re-adopting it, or re-publishing it as "draft-", is the owner's call.
 */
export const LEGAL_DOCS_VERSION = "v4-2026-09-15";

/** True while LEGAL_DOCS_VERSION still carries the draft prefix. The pages mark themselves from this. */
export const LEGAL_DOCS_ARE_DRAFT = LEGAL_DOCS_VERSION.startsWith("draft-");

/**
 * True only when a reader can tell who operates the interface AND how to reach them. A name
 * with no mailbox is a nameplate, and a mailbox with no name is a mailbox; neither is an
 * operator. The pages show the gap notice whenever this is false.
 */
export function operatorIsDesignated(): boolean {
  return (
    OPERATOR_LEGAL_NAME !== undefined &&
    (LEGAL_CONTACT_EMAIL !== undefined ||
      PRIVACY_CONTACT_EMAIL !== undefined ||
      SECURITY_CONTACT_EMAIL !== undefined)
  );
}

/**
 * What /terms and /privacy render at the top while operatorIsDesignated() is false. One string,
 * so the two pages cannot drift into two descriptions of the same gap.
 */
export const OPERATOR_GAP_NOTICE =
  "No operating entity has been designated for this interface yet. This document is in force; " +
  "the gap is published rather than filled with a placeholder.";

/** The words every unset operator fact renders as. Used inline, mid-sentence. */
export const NOT_YET_DESIGNATED = "not yet designated";

/**
 * The `Expires:` value for security.txt: the LEGAL_DOCS_VERSION date plus one year, as an ISO
 * 8601 instant. RFC 9116 recommends less than a year; we make it exactly a year from the last
 * review of the documents so a stale file expires on its own rather than advertising a mailbox
 * nobody has checked. Computed from the constant, never from the clock, so the route is
 * byte-identical across builds of the same commit.
 */
export function securityTxtExpires(): string {
  const match = /(\d{4})-(\d{2})-(\d{2})$/.exec(LEGAL_DOCS_VERSION);
  if (!match) {
    throw new Error(`LEGAL_DOCS_VERSION must end in YYYY-MM-DD, got ${JSON.stringify(LEGAL_DOCS_VERSION)}`);
  }
  const [, year, month, day] = match;
  // Date.UTC normalises a 29 February forward rather than producing an invalid date.
  return new Date(Date.UTC(Number(year) + 1, Number(month) - 1, Number(day))).toISOString();
}
