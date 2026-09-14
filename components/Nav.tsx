/**
 * Top bar for callhouse.finance (the mockup's .topbar). Server component; the only client code is
 * the link list in components/NavLinks.tsx, which needs usePathname for the active link.
 *
 * DOM order is the reader's journey: brand, how the week runs, what can go wrong, the legal
 * position, the docs, and only then "Open the app". On wide screens that is also the visual
 * order. Below 960px the links drop to their own full-width row under the brand and the button,
 * so the button stays reachable without a menu and every link stays one tap away at 390px.
 *
 * "Open the app" is the one control in the chrome that leaves this domain. It is a plain new-tab
 * <a> (Button detects the absolute URL), not next/link: app.callhouse.finance is a different
 * origin and a different Next application, so there is nothing to prefetch.
 *
 * DELIBERATELY ABSENT: any wallet or connect control. This package has no wallet code.
 */
import { NavLinks } from "@/components/NavLinks";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { APP_URL } from "@/lib/site";

export function Nav() {
  return (
    <header>
      <Container className="flex flex-wrap items-center gap-x-7 gap-y-2 pb-3 pt-4 lg:py-[22px]">
        <Brand className="order-1" />
        <nav
          aria-label="Site"
          className="order-3 w-full overflow-x-auto [scrollbar-width:none] max-[22rem]:[mask-image:linear-gradient(to_right,#000_85%,transparent)] lg:order-2 lg:mr-auto lg:w-auto lg:overflow-visible"
        >
          <NavLinks />
        </nav>
        <Button href={APP_URL} size="sm" className="order-2 ml-auto lg:order-3 lg:ml-0">
          Open the app
        </Button>
      </Container>
    </header>
  );
}
