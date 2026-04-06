import { type HTMLAttributes, useEffect, useState } from 'react';

import { ReadStatus } from '@prisma/client';
import { Bell, InboxIcon, MenuIcon, SearchIcon } from 'lucide-react';
import { Link, useParams } from 'react-router';

import { useSession } from '@documenso/lib/client-only/providers/session';
import { isPersonalLayout } from '@documenso/lib/utils/organisations';
import { getRootHref } from '@documenso/lib/utils/params';
import { trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';

import { BrandingLogo } from '~/components/general/branding-logo';
import { useOptionalCurrentTeam } from '~/providers/team';

import { AppCommandMenu } from './app-command-menu';
import { AppNavDesktop } from './app-nav-desktop';
import { AppNavMobile } from './app-nav-mobile';
import { MenuSwitcher } from './menu-switcher';
import { OrgMenuSwitcher } from './org-menu-switcher';

export type HeaderProps = HTMLAttributes<HTMLDivElement>;

export const Header = ({ className, ...props }: HeaderProps) => {
  const params = useParams();

  const { organisations } = useSession();
  const team = useOptionalCurrentTeam();
  const isNexisDashboard = Boolean(team);

  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const { data: unreadCountData } = trpc.document.inbox.getCount.useQuery(
    {
      readStatus: ReadStatus.NOT_OPENED,
    },
    {
      // refetchInterval: 30000, // Refetch every 30 seconds
    },
  );

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', onScroll);

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'supports-backdrop-blur:bg-background/60 sticky top-0 z-[60] flex h-16 w-full items-center border-b border-b-transparent bg-background/95 backdrop-blur duration-200',
        scrollY > 5 && !isNexisDashboard && 'border-b-border',
        isNexisDashboard &&
          'supports-backdrop-blur:bg-black/90 border-b-white/10 bg-black text-white backdrop-blur',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'flex w-full items-center justify-between gap-x-4',
          isNexisDashboard ? 'px-[12px]' : 'mx-auto max-w-screen-xl px-4 md:justify-normal md:px-8',
        )}
      >
        <Link
          to={getRootHref(params)}
          className={cn(
            'rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isNexisDashboard
              ? 'inline-flex items-center ring-offset-black'
              : 'hidden ring-offset-background md:inline',
          )}
        >
          {isNexisDashboard ? (
            <img
              src="/static/logo-docseal.svg"
              alt="DocSeal"
              className="h-[22px] w-auto max-w-[min(50vw,10rem)] shrink-0 object-contain object-left sm:max-w-none"
            />
          ) : (
            <BrandingLogo className="h-6 w-auto" />
          )}
        </Link>

        <AppNavDesktop setIsCommandMenuOpen={setIsCommandMenuOpen} />

        {isNexisDashboard ? (
          <Button
            asChild
            variant="ghost"
            className="relative hidden h-10 w-10 shrink-0 rounded-lg text-white/80 hover:bg-white/10 hover:text-white md:flex"
          >
            <Link to="/inbox" className="relative flex h-10 w-10 items-center justify-center">
              <Bell className="h-6 w-6 shrink-0" aria-hidden="true" />
              {unreadCountData && unreadCountData.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#48EAE5] px-1 text-[9px] font-bold text-[#0B0C0E]">
                  {unreadCountData.count > 99 ? '99+' : unreadCountData.count}
                </span>
              )}
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            className="relative hidden h-10 w-10 rounded-lg md:flex"
          >
            <Link to="/inbox" className="relative block h-10 w-10">
              <InboxIcon className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground" />

              {unreadCountData && unreadCountData.count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {unreadCountData.count > 99 ? '99+' : unreadCountData.count}
                </span>
              )}
            </Link>
          </Button>
        )}

        {isNexisDashboard && <span className="hidden h-8 w-px shrink-0 bg-white/15 md:block" />}

        <div className={cn('md:ml-4', isNexisDashboard && 'md:ml-3')}>
          {isPersonalLayout(organisations) ? <MenuSwitcher /> : <OrgMenuSwitcher />}
        </div>

        <div className="flex flex-row items-center space-x-4 md:hidden">
          <button onClick={() => setIsCommandMenuOpen(true)}>
            <SearchIcon className="h-6 w-6 text-muted-foreground" />
          </button>

          <button onClick={() => setIsHamburgerMenuOpen(true)}>
            <MenuIcon className="h-6 w-6 text-muted-foreground" />
          </button>

          <AppCommandMenu open={isCommandMenuOpen} onOpenChange={setIsCommandMenuOpen} />

          <AppNavMobile
            isMenuOpen={isHamburgerMenuOpen}
            onMenuOpenChange={setIsHamburgerMenuOpen}
          />
        </div>
      </div>
    </header>
  );
};
