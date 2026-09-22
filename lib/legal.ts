/**
 * The one place this package knows who operates it.
 *
 * Every "who is behind this" fact on /terms, /privacy, /legal#reporting and
 * /.well-known/security.txt reads from here and nowhere else. The values are the legal name of
 * the operating entity, where it is organised, which law governs the terms, and the three
 * contact addresses. As of 2026-09-15 only the three contact addresses are set, on the Railway site
 * service (security@, legal@ and privacy@stonkhouse.fun); no entity has been formed or chosen and no
 * counsel has named a governing law. stonkhousedotfun/callhouse: `ops/launch-legal.md` is the list of
 * decisions that fills these in.
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
 * `next build` at all (README.md "Deploy"). stonkhousedotfun/callhouse: `ops/launch-legal.md` walks
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
 * The date the legal documents were last reviewed, used for ONE thing: deriving the `Expires:`
 * line of /.well-known/security.txt, which RFC 9116 makes mandatory.
 *
 * THIS IS NOT A GATE. It was `LEGAL_DOCS_VERSION` until 2026-09-21, when the owner removed the
 * versioning machinery: the rule that wording could not change without bumping a version, the
 * draft flag derived from a "draft-" prefix, and the chips and markers the pages rendered from
 * them. The instruction was that nothing should stop us saying something. So nothing here does.
 *
 * Update it when the documents are reviewed. Nothing checks that you did - not this file, not a
 * linter (copy-lint was removed the same day), not CI. A stale date means security.txt advertises
 * a mailbox whose last review is older than it claims, which is the only cost left.
 */
export const LEGAL_DOCS_REVIEWED = "2026-09-20";

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
 * The `Expires:` value for security.txt: LEGAL_DOCS_REVIEWED plus one year, as an ISO
 * 8601 instant. RFC 9116 recommends less than a year; we make it exactly a year from the last
 * review of the documents so a stale file expires on its own rather than advertising a mailbox
 * nobody has checked. Computed from the constant, never from the clock, so the route is
 * byte-identical across builds of the same commit.
 */
export function securityTxtExpires(reviewed = LEGAL_DOCS_REVIEWED): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(reviewed);
  if (!match) {
    throw new Error(`LEGAL_DOCS_REVIEWED must be YYYY-MM-DD, got ${JSON.stringify(reviewed)}`);
  }
  const [, year, month, day] = match;
  const reviewedDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (reviewedDate.toISOString().slice(0, 10) !== reviewed) {
    throw new Error(`LEGAL_DOCS_REVIEWED must be a real date, got ${JSON.stringify(reviewed)}`);
  }
  // Date.UTC normalises a 29 February forward rather than producing an invalid date.
  return new Date(Date.UTC(Number(year) + 1, Number(month) - 1, Number(day))).toISOString();
}
