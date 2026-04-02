import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Link } from 'react-router';

import { AuthNexisShell, AuthNexisUserIcon } from '~/components/auth/auth-nexis-shell';
import { ForgotPasswordForm } from '~/components/forms/forgot-password';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Forgot Password`);
}

export default function ForgotPasswordPage() {
  return (
    <AuthNexisShell>
      <AuthNexisUserIcon />

      <div className="w-full">
        <h1 className="mb-2 text-3xl font-bold leading-tight">
          <Trans>Forgot your password?</Trans>
        </h1>

        <p className="mb-8 max-w-[360px] text-base leading-relaxed text-gray-400">
          <Trans>
            No worries, it happens! Enter your email and we'll email you a special link to reset
            your password.
          </Trans>
        </p>

        <ForgotPasswordForm className="w-[360px]" />

        <p className="mt-6 w-[360px] text-left text-sm text-gray-400">
          <Trans>
            Remembered your password?{' '}
            <Link to="/signin" className="text-cyan-300 hover:underline">
              Sign In
            </Link>
          </Trans>
        </p>
      </div>
    </AuthNexisShell>
  );
}
