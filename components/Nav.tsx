/**
 * Top bar for stonkhouse.fun. Server component; the only client code is NavLinks
 * (usePathname for the active "How it works" link).
 *
 * Visual and focus order: brand, how a week runs, then X / GitHub and "Open the app".
 * Risks and legal live in the footer, not here. Below 960px the brand has its own row,
 * with the link and right cluster below it, so the Buy button and marks stay reachable without a menu.
 *
 * "Buy" and the two marks leave this origin. They are plain new-tab <a>s.
 *
 * DELIBERATELY ABSENT: any wallet or connect control. This package has no wallet code.
 */
import { NavLinks } from "@/components/NavLinks";
import { SocialLinks } from "@/components/SocialLinks";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { OPEN_APP } from "@/lib/site";

export function Nav() {
  return (
    <header>
      <Container className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-7 gap-y-2 pb-3 pt-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:py-[22px]">
        <Brand className="col-span-2 lg:col-span-1" />
        <nav
          aria-label="Site"
          className="min-w-0 overflow-x-auto [scrollbar-width:none] lg:overflow-visible"
        >
          <NavLinks />
        </nav>
        <div className="flex items-center gap-2">
          <SocialLinks />
          <Button href={OPEN_APP} size="sm">
            Launch App
          </Button>
        </div>
      </Container>
    </header>
  );
}
