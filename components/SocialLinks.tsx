/**
 * X and GitHub marks. The old GitBook is linked as legacy v1 in the footer only.
 * Each leaves this origin, so they are plain new-tab <a>s.
 */
import { ExternalLink } from "@/components/ui/ExternalLink";
import { GitHubIcon, XIcon } from "@/components/ui/icons";
import { GITHUB_URL, X_URL } from "@/lib/site";

const ITEM =
  "grid size-9 place-items-center rounded-[10px] text-ink-2 no-underline transition-colors duration-150 hover:bg-surface-2 hover:text-ink";

export function SocialLinks() {
  return (
    <nav aria-label="Stonkhouse elsewhere">
      <ul className="flex items-center gap-0.5">
        <li>
          <ExternalLink href={X_URL} className={ITEM} aria-label="X">
            <XIcon size={15} />
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href={GITHUB_URL} className={ITEM} aria-label="GitHub">
            <GitHubIcon size={16} />
          </ExternalLink>
        </li>
      </ul>
    </nav>
  );
}
