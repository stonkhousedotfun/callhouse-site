/**
 * Top bar for stonkhouse.fun. Server component; the client islands are NavLinks
 * (usePathname: it marks whichever header link is the current route) and ThemeToggle (the night/day switch,
 * app/_components/ThemeToggle.tsx; the app's header leads its right cluster with the
 * same toggle, callhouse web/components/Nav.tsx).
 *
 * Visual and focus order follows the Neon mockup: brand; How it works,
 * FAQ, Risks and Docs (NavLinks); then the theme toggle, X / GitHub and "Launch App". Risks is here
 * and in the footer; Legal, Terms and Privacy are footer only. Docs is the v8 GitBook (DOCS_URL,
 * passed down so the client island does not import lib/site). Below 960px the brand has its own row,
 * with the link and right cluster below it, so the Buy button and marks stay reachable without a menu.
 *
 * "Buy" and the two marks leave this origin. They are plain new-tab <a>s.
 *
 * DELIBERATELY ABSENT: any wallet or connect control. This package has no wallet code.
 */
import { ThemeToggle } from "@/app/_components/ThemeToggle";
import { NavLinks } from "@/components/NavLinks";
import { SocialLinks } from "@/components/SocialLinks";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { DOCS_URL, OPEN_APP } from "@/lib/site";

export function Nav() {
  return (
    <header>
      <Container className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-7 gap-y-2 pb-3 pt-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:py-[22px]">
        <Brand className="col-span-2 lg:col-span-1" />
        <nav
          aria-label="Site"
          className="min-w-0 overflow-x-auto [scrollbar-width:none] lg:overflow-visible"
        >
          <NavLinks docsHref={DOCS_URL} />
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SocialLinks />
          <Button href={OPEN_APP} size="sm">
            Launch App
          </Button>
        </div>
      </Container>
    </header>
  );
}
