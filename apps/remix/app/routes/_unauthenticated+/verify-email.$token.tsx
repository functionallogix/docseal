import { useEffect, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { AlertTriangle, Loader, XCircle } from 'lucide-react';
import { Link, redirect, useNavigate } from 'react-router';
import { match } from 'ts-pattern';

import { authClient } from '@documenso/auth/client';
import { useOptionalSession } from '@documenso/lib/client-only/providers/session';
import { EMAIL_VERIFICATION_STATE } from '@documenso/lib/constants/email';
import { Button } from '@documenso/ui/primitives/button';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { AuthNexisEmailShell } from '~/components/auth/auth-nexis-email-shell';
import { appMetaTags } from '~/utils/meta';

import type { Route } from './+types/verify-email.$token';

export function meta() {
  return appMetaTags(msg`Verify email`);
}

const nexisPrimaryButtonClass =
  'mt-8 h-11 w-full rounded-full border border-[#48EAE5] bg-[#48EAE5] text-sm font-semibold text-[#0B0C0E] hover:bg-[#38d4cf]';

export const loader = ({ params }: Route.LoaderArgs) => {
  const { token } = params;

  if (!token) {
    throw redirect('/verify-email');
  }

  return {
    token,
  };
};

export default function VerifyEmailPage({ loaderData }: Route.ComponentProps) {
  const { token } = loaderData;

  const { refreshSession } = useOptionalSession();
  const { _ } = useLingui();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [state, setState] = useState<keyof typeof EMAIL_VERIFICATION_STATE | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const verifyToken = async () => {
    setIsLoading(true);

    try {
      const response = await authClient.emailPassword.verifyEmail({
        token,
      });

      await refreshSession();

      setState(response.state);
    } catch (err) {
      console.error(err);

      toast({
        title: _(msg`Something went wrong`),
        description: _(msg`We were unable to verify your email at this time.`),
      });

      await navigate('/verify-email');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void verifyToken();
  }, []);

  if (isLoading || state === null) {
    return (
      <AuthNexisEmailShell>
        <div className="flex flex-col items-start py-8">
          <Loader className="h-10 w-10 animate-spin text-[#48EAE5]" aria-hidden="true" />
          <p className="mt-4 text-start text-sm text-slate-400">
            <Trans>Verifying your email…</Trans>
          </p>
        </div>
      </AuthNexisEmailShell>
    );
  }

  const inner = match(state)
    .with(EMAIL_VERIFICATION_STATE.NOT_FOUND, () => (
      <div className="flex w-full flex-col items-stretch">
        <div className="mb-6 flex h-14 w-14 items-center justify-center self-start rounded-2xl border border-amber-500/40 bg-amber-500/10">
          <AlertTriangle className="h-8 w-8 text-amber-400" strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 className="text-start text-2xl font-bold text-white md:text-3xl">
          <Trans>Something went wrong</Trans>
        </h2>
        <p className="mt-4 text-start text-sm leading-relaxed text-slate-400 md:text-[15px]">
          <Trans>
            We were unable to verify your email. If your email is not verified already, please try
            again.
          </Trans>
        </p>
        <Button className={nexisPrimaryButtonClass} asChild>
          <Link to="/">
            <Trans>Go back home</Trans>
          </Link>
        </Button>
      </div>
    ))
    .with(EMAIL_VERIFICATION_STATE.EXPIRED, () => (
      <div className="flex w-full flex-col items-stretch">
        <div className="mb-6 flex h-14 w-14 items-center justify-center self-start rounded-2xl border border-red-500/35 bg-red-500/10">
          <XCircle className="h-8 w-8 text-red-400" strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 className="text-start text-2xl font-bold text-white md:text-3xl">
          <Trans>Your token has expired!</Trans>
        </h2>
        <p className="mt-4 text-start text-sm leading-relaxed text-slate-400 md:text-[15px]">
          <Trans>
            It seems that the provided token has expired. We've just sent you another token, please
            check your email and try again.
          </Trans>
        </p>
        <Button className={nexisPrimaryButtonClass} asChild>
          <Link to="/">
            <Trans>Go back home</Trans>
          </Link>
        </Button>
      </div>
    ))
    .with(EMAIL_VERIFICATION_STATE.VERIFIED, () => (
      <div className="flex w-full flex-col items-stretch">
        <div className="mb-6 self-start">
          <img
            src="/static/icon-email.svg"
            alt=""
            className="h-[60px] w-[60px]"
            aria-hidden="true"
          />
        </div>
        <h2 className="text-start text-2xl font-bold text-white md:text-3xl">
          <Trans>Email Confirmed!</Trans>
        </h2>
        <p className="mt-4 text-start text-sm leading-relaxed text-slate-400 md:text-[15px]">
          <Trans>
            Your email has been successfully confirmed! You can now use all features of MOS.
          </Trans>
        </p>
        <Button className={nexisPrimaryButtonClass} asChild>
          <Link to="/">
            <Trans>Continue</Trans>
          </Link>
        </Button>
      </div>
    ))
    .with(EMAIL_VERIFICATION_STATE.ALREADY_VERIFIED, () => (
      <div className="flex w-full flex-col items-stretch">
        <div className="mb-6 self-start">
          <img
            src="/static/icon-email.svg"
            alt=""
            className="h-[60px] w-[60px]"
            aria-hidden="true"
          />
        </div>
        <h2 className="text-start text-2xl font-bold text-white md:text-3xl">
          <Trans>Email already confirmed</Trans>
        </h2>
        <p className="mt-4 text-start text-sm leading-relaxed text-slate-400 md:text-[15px]">
          <Trans>Your email has already been confirmed. You can now use all features of MOS.</Trans>
        </p>
        <Button className={nexisPrimaryButtonClass} asChild>
          <Link to="/">
            <Trans>Go back home</Trans>
          </Link>
        </Button>
      </div>
    ))
    .exhaustive();

  return <AuthNexisEmailShell>{inner}</AuthNexisEmailShell>;
}
