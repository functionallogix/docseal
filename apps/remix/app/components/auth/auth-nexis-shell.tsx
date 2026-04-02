import type { ReactNode } from 'react';

import { cn } from '@documenso/ui/lib/utils';

type AuthNexisUserIconProps = {
  /** Tighter block for compact signup layout */
  compact?: boolean;
};

export function AuthNexisUserIcon({ compact }: AuthNexisUserIconProps) {
  return (
    <div className={compact ? 'mb-3' : 'mb-6'}>
      <div
        className={cn(
          'flex items-center justify-center rounded-[15px] border border-[#48EAE566] bg-[#48EAE533]',
          compact ? 'h-[52px] w-[52px] px-3 py-2.5' : 'h-[60px] w-[60px] px-[17px] py-[13px]',
        )}
      >
        <img
          src="/static/nexis-user-icon.svg"
          alt=""
          className={compact ? 'h-6 w-6' : 'h-7 w-7'}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

type AuthNexisShellProps = {
  children: ReactNode;
  /** Wider column for signup etc. Default matches login/forgot (max-w-md). */
  contentMaxClassName?: string;
  /** Main layout override; e.g. signup uses items-start + pt-* so the whole column sits lower. */
  mainClassName?: string;
};

export function AuthNexisShell({
  children,
  contentMaxClassName = 'max-w-md',
  mainClassName,
}: AuthNexisShellProps) {
  return (
    <div className="auth-nexis-viewport relative h-dvh max-h-dvh min-h-0 overflow-hidden overscroll-none bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-full w-[48%] overflow-hidden">
          <img
            src="/static/bg-left.svg"
            alt=""
            aria-hidden="true"
            className="absolute left-[-22%] top-[-15%] h-[130%] w-[130%] max-w-none object-cover opacity-95"
          />
        </div>
      </div>

      <header className="absolute right-0 top-0 z-20 p-4 md:p-6">
        <img src="/static/logo-docseal.svg" alt="Docseal logo" className="h-6 w-auto opacity-90" />
      </header>

      <main
        className={cn(
          'pb-22 md:pb-26 relative z-10 flex h-full max-h-full min-h-0 justify-end overflow-hidden pr-8 md:pr-16',
          mainClassName ?? 'items-center',
        )}
      >
        <section className={cn('ml-16 min-h-0 w-full text-white', contentMaxClassName)}>
          {children}
        </section>
      </main>

      <footer className="absolute bottom-0 right-0 z-10 flex items-center gap-2 p-4 md:gap-3 md:p-6">
        <span className="text-xs text-white md:text-sm">Powered by</span>
        <img src="/static/nexis-mos-logo.svg" alt="MOS logo" className="h-6 w-6 md:h-8 md:w-8" />
        <span className="text-xs text-white md:text-sm">Mapped out solutions</span>
      </footer>
    </div>
  );
}
