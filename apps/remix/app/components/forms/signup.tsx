import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useForm } from 'react-hook-form';
import { FaIdCardClip } from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';

import { authClient } from '@documenso/auth/client';
import { useAnalytics } from '@documenso/lib/client-only/hooks/use-analytics';
import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { ZPasswordSchema } from '@documenso/trpc/server/auth-router/schema';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form/form';
import { Input } from '@documenso/ui/primitives/input';
import { PasswordInput } from '@documenso/ui/primitives/password-input';
import { SignaturePadDialog } from '@documenso/ui/primitives/signature-pad/signature-pad-dialog';
import { useToast } from '@documenso/ui/primitives/use-toast';

export const ZSignUpFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: msg`Please enter a valid name.`.id }),
    email: z.string().email().min(1),
    password: ZPasswordSchema,
    signature: z.string().min(1, { message: msg`We need your signature to sign documents`.id }),
  })
  .refine(
    (data) => {
      const { name, email, password } = data;
      return !password.includes(name) && !password.includes(email.split('@')[0]);
    },
    {
      message: msg`Password should not be common or based on personal information`.id,
      path: ['password'],
    },
  );

export const SIGNUP_ERROR_MESSAGES: Record<string, MessageDescriptor> = {
  SIGNUP_DISABLED: msg`Signup is currently disabled or not available for your email domain.`,
  [AppErrorCode.ALREADY_EXISTS]: msg`User with this email already exists. Please use a different email address.`,
  [AppErrorCode.INVALID_REQUEST]: msg`We were unable to create your account. Please review the information you provided and try again.`,
};

export type TSignUpFormSchema = z.infer<typeof ZSignUpFormSchema>;

export type SignUpFormProps = {
  className?: string;
  initialEmail?: string;
  isGoogleSSOEnabled?: boolean;
  isMicrosoftSSOEnabled?: boolean;
  isOIDCSSOEnabled?: boolean;
  returnTo?: string;
};

export const SignUpForm = ({
  className,
  initialEmail,
  isGoogleSSOEnabled,
  isMicrosoftSSOEnabled,
  isOIDCSSOEnabled,
  returnTo,
}: SignUpFormProps) => {
  const { _ } = useLingui();
  const { toast } = useToast();

  const analytics = useAnalytics();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const utmSrc = searchParams.get('utm_source') ?? null;

  const hasSocialAuthEnabled = isGoogleSSOEnabled || isMicrosoftSSOEnabled || isOIDCSSOEnabled;

  const form = useForm<TSignUpFormSchema>({
    values: {
      name: '',
      email: initialEmail ?? '',
      password: '',
      signature: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(ZSignUpFormSchema),
  });

  const isSubmitting = form.formState.isSubmitting;

  const onFormSubmit = async ({ name, email, password, signature }: TSignUpFormSchema) => {
    try {
      await authClient.emailPassword.signUp({
        name,
        email,
        password,
        signature,
      });

      await navigate(returnTo ? returnTo : '/unverified-account');

      toast({
        title: _(msg`Registration Successful`),
        description: _(
          msg`You have successfully registered. Please verify your account by clicking on the link you received in the email.`,
        ),
        duration: 5000,
      });

      analytics.capture('App: User Sign Up', {
        email,
        timestamp: new Date().toISOString(),
        custom_campaign_params: { src: utmSrc },
      });
    } catch (err) {
      const error = AppError.parseError(err);

      const errorMessage =
        SIGNUP_ERROR_MESSAGES[error.code] ?? SIGNUP_ERROR_MESSAGES.INVALID_REQUEST;

      toast({
        title: _(msg`An error occurred`),
        description: _(errorMessage),
        variant: 'destructive',
      });
    }
  };

  const onSignUpWithGoogleClick = async () => {
    try {
      await authClient.google.signIn();
    } catch (err) {
      toast({
        title: _(msg`An unknown error occurred`),
        description: _(
          msg`We encountered an unknown error while attempting to sign you Up. Please try again later.`,
        ),
        variant: 'destructive',
      });
    }
  };

  const onSignUpWithMicrosoftClick = async () => {
    try {
      await authClient.microsoft.signIn();
    } catch (err) {
      toast({
        title: _(msg`An unknown error occurred`),
        description: _(
          msg`We encountered an unknown error while attempting to sign you Up. Please try again later.`,
        ),
        variant: 'destructive',
      });
    }
  };

  const onSignUpWithOIDCClick = async () => {
    try {
      await authClient.oidc.signIn();
    } catch (err) {
      toast({
        title: _(msg`An unknown error occurred`),
        description: _(
          msg`We encountered an unknown error while attempting to sign you Up. Please try again later.`,
        ),
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const hash = window.location.hash.slice(1);

    const params = new URLSearchParams(hash);

    const email = params.get('email');

    if (email) {
      form.setValue('email', email);
    }
  }, [form]);

  return (
    <div className={cn('w-full', className)}>
      <Form {...form}>
        <form
          className="flex w-full flex-col gap-y-2 text-sm"
          onSubmit={form.handleSubmit(onFormSubmit)}
        >
          <fieldset className="flex w-full flex-col gap-y-2" disabled={isSubmitting}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">
                    <Trans>Full Name</Trans>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder={_(msg`Full name`)}
                      className="h-9 w-full rounded-full border border-white/20 bg-transparent px-4 text-sm text-white placeholder:text-gray-500 focus-visible:ring-cyan-400/60"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">
                    <Trans>Email Address</Trans>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={_(msg`Email address`)}
                      className="h-9 w-full rounded-full border border-white/20 bg-transparent px-4 text-sm text-white placeholder:text-gray-500 focus-visible:ring-cyan-400/60"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">
                    <Trans>Password</Trans>
                  </FormLabel>

                  <FormControl>
                    <PasswordInput
                      placeholder={_(msg`Password`)}
                      className="h-9 w-full rounded-full border border-white/20 bg-transparent px-4 text-sm text-white placeholder:text-gray-500 focus-visible:ring-cyan-400/60"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="signature"
              render={({ field: { onChange, value } }) => (
                <FormItem>
                  <FormLabel className="sr-only">
                    <Trans>Sign Here</Trans>
                  </FormLabel>
                  <FormControl>
                    <SignaturePadDialog
                      disabled={isSubmitting}
                      value={value}
                      dialogConfirmText={msg`Create account`}
                      onChange={(v) => onChange(v ?? '')}
                      className={cn(
                        '!aspect-auto min-h-[12.5rem] w-full rounded-2xl border border-white/25 bg-white/[0.06]',
                        '[&_svg]:!text-cyan-400/85',
                        '[&_button]:rounded-2xl hover:[&_button]:bg-white/[0.08]',
                      )}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {hasSocialAuthEnabled && (
              <div className="relative flex items-center justify-center gap-x-4 py-1 text-[10px] uppercase tracking-wider text-slate-500">
                <div className="h-px flex-1 bg-white/20" />
                <span className="bg-transparent text-slate-400">
                  <Trans>Or</Trans>
                </span>
                <div className="h-px flex-1 bg-white/20" />
              </div>
            )}

            {isGoogleSSOEnabled && (
              <Button
                type="button"
                size="sm"
                variant={'outline'}
                className="h-8 w-full border border-white/20 bg-transparent text-xs text-slate-200 hover:bg-[#08111c] md:h-9 md:text-sm"
                disabled={isSubmitting}
                onClick={onSignUpWithGoogleClick}
              >
                <FcGoogle className="mr-2 h-4 w-4" />
                <Trans>Sign Up with Google</Trans>
              </Button>
            )}

            {isMicrosoftSSOEnabled && (
              <Button
                type="button"
                size="sm"
                variant={'outline'}
                className="h-8 w-full border border-white/20 bg-transparent text-xs text-slate-200 hover:bg-[#08111c] md:h-9 md:text-sm"
                disabled={isSubmitting}
                onClick={onSignUpWithMicrosoftClick}
              >
                <img
                  className="mr-2 h-3.5 w-3.5"
                  alt="Microsoft Logo"
                  src={'/static/microsoft.svg'}
                />
                <Trans>Sign Up with Microsoft</Trans>
              </Button>
            )}

            {isOIDCSSOEnabled && (
              <Button
                type="button"
                size="sm"
                variant={'outline'}
                className="h-8 w-full border border-white/20 bg-transparent text-xs text-slate-200 hover:bg-[#08111c] md:h-9 md:text-sm"
                disabled={isSubmitting}
                onClick={onSignUpWithOIDCClick}
              >
                <FaIdCardClip className="mr-2 h-4 w-4" />
                <Trans>Sign Up with OIDC</Trans>
              </Button>
            )}
          </fieldset>

          <p className="mb-2 text-left text-[11px] text-gray-400 md:mb-3 md:text-xs">
            <Trans>
              Already have an account?{' '}
              <Link
                to={returnTo ? `/signin?returnTo=${encodeURIComponent(returnTo)}` : '/signin'}
                className="text-cyan-300 hover:underline"
              >
                Sign in
              </Link>
            </Trans>
          </p>

          <Button
            loading={form.formState.isSubmitting}
            type="submit"
            size="sm"
            className="h-9 w-full rounded-[10px] border border-[#48EAE5] bg-[#48EAE5] px-4 text-sm font-semibold text-[#0B0C0E] hover:bg-[#38d4cf] md:h-10"
          >
            <Trans>Create account</Trans>
          </Button>
        </form>
      </Form>

      <p className="mt-2 w-full text-[10px] leading-snug text-gray-400 md:mt-3 md:text-[11px]">
        <Trans>
          By proceeding, you agree to our{' '}
          <Link
            to="https://documen.so/terms"
            target="_blank"
            className="text-cyan-300 hover:underline"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            to="https://documen.so/privacy"
            target="_blank"
            className="text-cyan-300 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </Trans>
      </p>
    </div>
  );
};
