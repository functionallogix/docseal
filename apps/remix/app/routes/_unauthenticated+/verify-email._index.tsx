import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { XCircle } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@documenso/ui/primitives/button';

import { AuthNexisEmailShell } from '~/components/auth/auth-nexis-email-shell';
import { appMetaTags } from '~/utils/meta';

const nexisPrimaryButtonClass =
  'mt-8 h-11 w-full rounded-full border border-[#48EAE5] bg-[#48EAE5] text-sm font-semibold text-[#0B0C0E] hover:bg-[#38d4cf]';

export function meta() {
  return appMetaTags(msg`Verify Email`);
}

export default function EmailVerificationWithoutTokenPage() {
  return (
    <AuthNexisEmailShell>
      <div className="flex w-full flex-col items-stretch">
        <div className="mb-6 flex h-14 w-14 items-center justify-center self-start rounded-2xl border border-red-500/35 bg-red-500/10">
          <XCircle className="h-8 w-8 text-red-400" strokeWidth={2} aria-hidden="true" />
        </div>
        <h1 className="text-start text-2xl font-bold text-white md:text-3xl">
          <Trans>Uh oh! Looks like you're missing a token</Trans>
        </h1>
        <p className="mt-4 text-start text-sm leading-relaxed text-slate-400 md:text-[15px]">
          <Trans>
            It seems that there is no token provided, if you are trying to verify your email please
            follow the link in your email.
          </Trans>
        </p>
        <Button className={nexisPrimaryButtonClass} asChild>
          <Link to="/">
            <Trans>Go back home</Trans>
          </Link>
        </Button>
      </div>
    </AuthNexisEmailShell>
  );
}
