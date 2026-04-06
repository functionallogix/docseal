import type { ReactNode } from 'react';

type AuthNexisEmailShellProps = {
  children: ReactNode;
};

/**
 * Nexis email flow (confirm / verified): black screen, cyan ellipse glow, logo + footer; content text-start.
 */
export function AuthNexisEmailShell({ children }: AuthNexisEmailShellProps) {
  return (
    <div className="auth-nexis-viewport relative flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden overscroll-none bg-black">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <img
          src="/static/ellipse-email-confirm.svg"
          alt=""
          aria-hidden="true"
          className="h-[min(100vmin,950px)] w-[min(100vmin,950px)] max-w-none shrink-0 object-contain"
        />
      </div>

      <header className="absolute right-0 top-0 z-20 p-4 md:p-6">
        <img src="/static/logo-docseal.svg" alt="Docseal logo" className="h-6 w-auto opacity-90" />
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-20 md:py-24">
        <div className="relative z-10 w-full max-w-md text-start text-white">{children}</div>
      </main>

      <footer className="absolute bottom-0 right-0 z-10 flex items-center gap-2 p-4 md:gap-3 md:p-6">
        <span className="text-xs text-white md:text-sm">Powered by</span>
        <img src="/static/nexis-mos-logo.svg" alt="MOS logo" className="h-6 w-6 md:h-8 md:w-8" />
        <span className="text-xs text-white md:text-sm">Mapped out solutions</span>
      </footer>
    </div>
  );
}
