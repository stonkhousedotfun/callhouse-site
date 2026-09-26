/**
 * X, Telegram and GitHub marks. The docs are not a mark here: they describe the current v8 contracts and are a
 * text link to DOCS_URL, "Docs" in the header's link list and "Documentation" in the footer.
 * Each leaves this origin, so they are plain new-tab <a>s.
 */
import { ExternalLink } from "@/components/ui/ExternalLink";
import { GitHubIcon, TelegramIcon, XIcon } from "@/components/ui/icons";
import { GITHUB_URL, TELEGRAM_URL, X_URL } from "@/lib/site";

const ITEM =
  "grid size-9 place-items-center rounded-[10px] text-ink-2 no-underline transition-colors duration-150 hover:bg-surface-2 hover:text-ink";

export function SocialLinks() {
  return (
    <nav aria-label="Stonkhouse elsewhere">
      <ul className="flex items-center gap-0.5">
        <li>
          <ExternalLink href={X_URL} className={ITEM} aria-label="X (opens in a new tab)" srNote={false}>
            <XIcon size={15} />
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href={TELEGRAM_URL} className={ITEM} aria-label="Telegram (opens in a new tab)" srNote={false}>
            <TelegramIcon size={16} />
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href={GITHUB_URL} className={ITEM} aria-label="GitHub (opens in a new tab)" srNote={false}>
            <GitHubIcon size={16} />
          </ExternalLink>
        </li>
      </ul>
    </nav>
  );
}
