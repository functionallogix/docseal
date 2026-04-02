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

import { AuthNexisShell, AuthNexisUserIcon } from '~/components/auth/auth-nexis-shell';
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
    <AuthNexisShell>
      <AuthNexisUserIcon />

      <div className="w-full">
        {signupError && (
          <Alert variant="destructive" className="mb-5 w-[360px]">
            <AlertDescription>{_(signupError)}</AlertDescription>
          </Alert>
        )}

        <h1 className="mb-2 text-3xl font-bold leading-tight">
          <Trans>Log in to your account</Trans>
        </h1>

        <p className="mb-8 max-w-[360px] text-base leading-relaxed text-gray-400">
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
    </AuthNexisShell>
  );
}
