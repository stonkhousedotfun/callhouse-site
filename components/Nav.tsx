/**
 * Top bar for stonkhouse.fun. Server component; the only client code is NavLinks
 * (usePathname for the active "How it works" link).
 *
 * Visual order: brand, how a week runs, then on the right X / GitHub and "Open the app".
 * Risks and legal live in the footer, not here. Below 960px the how-it-works link drops under the
 * brand and the right cluster, so the Buy button and the marks stay reachable without a menu.
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
import { DEV_PREVIEW, OPEN_APP } from "@/lib/site";

export function Nav() {
  return (
    <header>
      <Container className="flex flex-wrap items-center gap-x-7 gap-y-2 pb-3 pt-4 lg:py-[22px]">
        <Brand className="order-1" />
        <nav
          aria-label="Site"
          className="order-3 w-full overflow-x-auto [scrollbar-width:none] lg:order-2 lg:mr-auto lg:w-auto lg:overflow-visible"
        >
          <NavLinks />
        </nav>
        <div className="order-2 ml-auto flex items-center gap-2 lg:order-3 lg:ml-0">
          <SocialLinks />
          <Button href={OPEN_APP} size="sm">
            {DEV_PREVIEW ? "Dev app" : "Buy"}
          </Button>
        </div>
      </Container>
    </header>
  );
}
