/** A configured link must fail closed instead of rendering a same-page reload. */
export function requireNonBlankHref(href: string): string {
  if (!href.trim()) throw new Error("Link href must not be blank");
  return href;
}

/** The labelled share example must have a paid cost and a usable multiple. */
export function requireExampleMultiple(cost: bigint, multiple: number | null): number {
  if (cost <= 0n || multiple === null || !Number.isFinite(multiple)) {
    throw new Error("Open Graph example requires a positive cost and finite multiple");
  }
  return multiple;
}
