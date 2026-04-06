import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { AuthNexisEmailShell } from '~/components/auth/auth-nexis-email-shell';
import { SendConfirmationEmailForm } from '~/components/forms/send-confirmation-email';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags(msg`Confirm email`);
}

export default function UnverifiedAccount() {
  return (
    <AuthNexisEmailShell>
      <div className="flex w-full flex-col items-stretch">
        <div className="mb-6 self-start">
          <img
            src="/static/icon-email.svg"
            alt=""
            className="h-[60px] w-[60px]"
            aria-hidden="true"
          />
        </div>

        <h1 className="text-start text-2xl font-bold tracking-tight text-white md:text-3xl">
          <Trans>Confirm email</Trans>
        </h1>

        <p className="mt-4 text-start text-sm leading-relaxed text-slate-400 md:text-[15px]">
          <Trans>
            To gain access to your account, please confirm your email address by clicking on the
            confirmation link from your inbox.
          </Trans>
        </p>

        <p className="mt-3 text-start text-sm leading-relaxed text-slate-400 md:text-[15px]">
          <Trans>
            If you don't find the confirmation link in your inbox, you can request a new one below.
          </Trans>
        </p>

        <SendConfirmationEmailForm variant="nexis" className="w-full" />
      </div>
    </AuthNexisEmailShell>
  );
}
