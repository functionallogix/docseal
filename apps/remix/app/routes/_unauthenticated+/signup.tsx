import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { redirect, useSearchParams } from 'react-router';

import {
  IS_GOOGLE_SSO_ENABLED,
  IS_MICROSOFT_SSO_ENABLED,
  IS_OIDC_SSO_ENABLED,
} from '@documenso/lib/constants/auth';
import { env } from '@documenso/lib/utils/env';
import { isValidReturnTo, normalizeReturnTo } from '@documenso/lib/utils/is-valid-return-to';
import { Alert, AlertDescription } from '@documenso/ui/primitives/alert';

import { AuthNexisShell, AuthNexisUserIcon } from '~/components/auth/auth-nexis-shell';
import { SIGNUP_ERROR_MESSAGES, SignUpForm } from '~/components/forms/signup';
import { appMetaTags } from '~/utils/meta';

import type { Route } from './+types/signup';

export function meta() {
  return appMetaTags(msg`Sign Up`);
}

export function loader({ request }: Route.LoaderArgs) {
  const NEXT_PUBLIC_DISABLE_SIGNUP = env('NEXT_PUBLIC_DISABLE_SIGNUP');

  // SSR env variables.
  const isGoogleSSOEnabled = IS_GOOGLE_SSO_ENABLED;
  const isMicrosoftSSOEnabled = IS_MICROSOFT_SSO_ENABLED;
  const isOIDCSSOEnabled = IS_OIDC_SSO_ENABLED;

  if (NEXT_PUBLIC_DISABLE_SIGNUP === 'true') {
    throw redirect('/signin');
  }

  let returnTo = new URL(request.url).searchParams.get('returnTo') ?? undefined;

  returnTo = isValidReturnTo(returnTo) ? normalizeReturnTo(returnTo) : undefined;

  return {
    isGoogleSSOEnabled,
    isMicrosoftSSOEnabled,
    isOIDCSSOEnabled,
    returnTo,
  };
}

export default function SignUp({ loaderData }: Route.ComponentProps) {
  const { isGoogleSSOEnabled, isMicrosoftSSOEnabled, isOIDCSSOEnabled, returnTo } = loaderData;
  const { _ } = useLingui();
  const [searchParams] = useSearchParams();
  const errorParam = searchParams.get('error');
  const signupError = errorParam ? SIGNUP_ERROR_MESSAGES[errorParam] : undefined;

  return (
    <AuthNexisShell contentMaxClassName="w-full max-w-none md:ml-12 md:w-1/2 lg:ml-16">
      <div className="mx-auto w-full max-w-[480px]">
        <AuthNexisUserIcon compact />

        {signupError && (
          <Alert variant="destructive" className="mb-3 w-full py-2">
            <AlertDescription>{_(signupError)}</AlertDescription>
          </Alert>
        )}

        <h1 className="mb-1 text-lg font-bold leading-snug tracking-tight md:text-xl">
          <Trans>Create a new account</Trans>
        </h1>

        <p className="mb-3 text-xs leading-snug text-gray-400 md:mb-4 md:text-sm md:leading-relaxed">
          <Trans>
            Create your account and start using state-of-the-art document signing. Open and
            beautiful signing is within your grasp.
          </Trans>
        </p>

        <SignUpForm
          isGoogleSSOEnabled={isGoogleSSOEnabled}
          isMicrosoftSSOEnabled={isMicrosoftSSOEnabled}
          isOIDCSSOEnabled={isOIDCSSOEnabled}
          returnTo={returnTo}
        />
      </div>
    </AuthNexisShell>
  );
}
