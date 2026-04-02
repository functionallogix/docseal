import { useEffect, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Link, redirect, useSearchParams } from 'react-router';

import { getOptionalSession } from '@documenso/auth/server/lib/utils/get-session';
import {
  IS_GOOGLE_SSO_ENABLED,
  IS_MICROSOFT_SSO_ENABLED,
  IS_OIDC_SSO_ENABLED,
  OIDC_PROVIDER_LABEL,
} from '@documenso/lib/constants/auth';
import { env } from '@documenso/lib/utils/env';
import { isValidReturnTo, normalizeReturnTo } from '@documenso/lib/utils/is-valid-return-to';
import { Alert, AlertDescription } from '@documenso/ui/primitives/alert';

import { SignInForm } from '~/components/forms/signin';
import { SIGNUP_ERROR_MESSAGES } from '~/components/forms/signup';
import { appMetaTags } from '~/utils/meta';

import type { Route } from './+types/signin';

export function meta() {
  return appMetaTags(msg`Sign In`);
}

export async function loader({ request }: Route.LoaderArgs) {
  const { isAuthenticated } = await getOptionalSession(request);

  // SSR env variables.
  const isGoogleSSOEnabled = IS_GOOGLE_SSO_ENABLED;
  const isMicrosoftSSOEnabled = IS_MICROSOFT_SSO_ENABLED;
  const isOIDCSSOEnabled = IS_OIDC_SSO_ENABLED;
  const oidcProviderLabel = OIDC_PROVIDER_LABEL;

  let returnTo = new URL(request.url).searchParams.get('returnTo') ?? undefined;

  returnTo = isValidReturnTo(returnTo) ? normalizeReturnTo(returnTo) : undefined;

  if (isAuthenticated) {
    throw redirect(returnTo || '/');
  }

  return {
    isGoogleSSOEnabled,
    isMicrosoftSSOEnabled,
    isOIDCSSOEnabled,
    oidcProviderLabel,
    returnTo,
  };
}

export default function SignIn({ loaderData }: Route.ComponentProps) {
  const {
    isGoogleSSOEnabled,
    isMicrosoftSSOEnabled,
    isOIDCSSOEnabled,
    oidcProviderLabel,
    returnTo,
  } = loaderData;

  const { _ } = useLingui();

  const [searchParams] = useSearchParams();
  const [isEmbeddedRedirect, setIsEmbeddedRedirect] = useState(false);

  const errorParam = searchParams.get('error');
  const signupError = errorParam ? SIGNUP_ERROR_MESSAGES[errorParam] : undefined;

  useEffect(() => {
    const hash = window.location.hash.slice(1);

    const params = new URLSearchParams(hash);

    setIsEmbeddedRedirect(params.get('embedded') === 'true');
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-full w-[48%] overflow-hidden">
          <img
            src="/static/bg-left.svg"
            alt=""
            aria-hidden="true"
            className="absolute left-[-21%] top-[-18%] h-[136%] w-[136%] max-w-none object-cover opacity-95"
          />
        </div>
      </div>

      <header className="absolute right-0 top-0 z-20 p-6">
        <img src="/static/logo-docseal.svg" alt="Docseal logo" className="h-8 w-auto opacity-90" />
      </header>

      <main className="relative z-10 flex min-h-screen items-center justify-end pb-32 pr-16">
        <section className="ml-16 w-full max-w-md text-white">
          <div className="mb-6">
            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-[15px] border border-[#48EAE566] bg-[#48EAE533] px-[17px] py-[13px]">
              <img
                src="/static/nexis-user-icon.svg"
                alt="User icon"
                className="h-7 w-7"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="w-full">
            {signupError && (
              <Alert variant="destructive" className="mb-5 w-[360px]">
                <AlertDescription>{_(signupError)}</AlertDescription>
              </Alert>
            )}

            <h1 className="mb-2 text-3xl font-bold leading-tight">
              <Trans>Log in to your account</Trans>
            </h1>

            <p className="mb-8 text-base text-gray-400">
              <Trans>Welcome back! Please enter your details.</Trans>
            </p>

            <div className="w-[360px]">
              <SignInForm
                className="nexis-signin-form"
                isGoogleSSOEnabled={isGoogleSSOEnabled}
                isMicrosoftSSOEnabled={isMicrosoftSSOEnabled}
                isOIDCSSOEnabled={isOIDCSSOEnabled}
                oidcProviderLabel={oidcProviderLabel}
                returnTo={returnTo}
              />
            </div>

            {!isEmbeddedRedirect && env('NEXT_PUBLIC_DISABLE_SIGNUP') !== 'true' && (
              <p className="mt-6 w-[360px] text-left text-sm text-gray-400">
                <Trans>
                  Don't have an account?{' '}
                  <Link
                    to={returnTo ? `/signup?returnTo=${encodeURIComponent(returnTo)}` : '/signup'}
                    className="text-cyan-300 hover:underline"
                  >
                    Sign up
                  </Link>
                </Trans>
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="absolute bottom-0 right-0 z-10 flex items-center gap-3 p-6">
        <span className="text-sm text-white">Powered by</span>
        <img src="/static/nexis-mos-logo.svg" alt="MOS logo" className="h-8 w-8" />
        <span className="text-sm text-white">Mapped out solutions</span>
      </footer>
    </div>
  );
}
