import { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { Trans } from '@lingui/react/macro';
import { DocumentDistributionMethod, DocumentStatus, EnvelopeType } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
import { InfoIcon, Link2, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { match } from 'ts-pattern';
import * as z from 'zod';

import { useCurrentEnvelopeEditor } from '@documenso/lib/client-only/providers/envelope-editor-provider';
import { useCurrentOrganisation } from '@documenso/lib/client-only/providers/organisation';
import { DO_NOT_INVALIDATE_QUERY_ON_MUTATION } from '@documenso/lib/constants/trpc';
import { extractDocumentAuthMethods } from '@documenso/lib/utils/document-auth';
import { getRecipientsWithMissingFields } from '@documenso/lib/utils/recipients';
import { trpc, trpc as trpcReact } from '@documenso/trpc/react';
import { DocumentSendEmailMessageHelper } from '@documenso/ui/components/document/document-send-email-message-helper';
import { cn } from '@documenso/ui/lib/utils';
import { Alert, AlertDescription } from '@documenso/ui/primitives/alert';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form/form';
import { Input } from '@documenso/ui/primitives/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { SpinnerBox } from '@documenso/ui/primitives/spinner';
import { Textarea } from '@documenso/ui/primitives/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@documenso/ui/primitives/tooltip';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { useEnvelopeEditorNexisChrome } from '~/components/general/envelope-editor/envelope-editor-nexis-chrome-context';
import {
  nexisDialogCancelButtonClassName,
  nexisDistributeDialogContentClassName,
  nexisDistributeDialogFieldShellClassName,
  nexisDistributeDialogMessageTextareaClassName,
  nexisDistributeDialogPillInputClassName,
  nexisDistributeDialogSelectTriggerClassName,
  nexisPrimaryButtonClassName,
  nexisRecipientRoleSelectContentClassName,
} from '~/utils/nexis-ui';

export type EnvelopeDistributeDialogProps = {
  onDistribute?: () => Promise<void>;
  documentRootPath: string;
  trigger?: React.ReactNode;
};

export const ZEnvelopeDistributeFormSchema = z.object({
  meta: z.object({
    emailId: z.string().nullable(),
    emailReplyTo: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.string().email().optional(),
    ),
    subject: z.string(),
    message: z.string(),
    distributionMethod: z
      .nativeEnum(DocumentDistributionMethod)
      .optional()
      .default(DocumentDistributionMethod.EMAIL),
  }),
});

export type TEnvelopeDistributeFormSchema = z.infer<typeof ZEnvelopeDistributeFormSchema>;

export const EnvelopeDistributeDialog = ({
  trigger,
  documentRootPath,
  onDistribute,
}: EnvelopeDistributeDialogProps) => {
  const organisation = useCurrentOrganisation();

  const { envelope, syncEnvelope, isAutosaving, autosaveError } = useCurrentEnvelopeEditor();
  const nexisChrome = useEnvelopeEditorNexisChrome();

  const { toast } = useToast();
  const { t } = useLingui();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { mutateAsync: distributeEnvelope } = trpcReact.envelope.distribute.useMutation();

  const form = useForm<TEnvelopeDistributeFormSchema>({
    defaultValues: {
      meta: {
        emailId: envelope.documentMeta?.emailId ?? null,
        emailReplyTo: envelope.documentMeta?.emailReplyTo || undefined,
        subject: envelope.documentMeta?.subject ?? '',
        message: envelope.documentMeta?.message ?? '',
        distributionMethod:
          envelope.documentMeta?.distributionMethod || DocumentDistributionMethod.EMAIL,
      },
    },
    resolver: zodResolver(ZEnvelopeDistributeFormSchema),
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = form;

  const { data: emailData, isLoading: isLoadingEmails } =
    trpc.enterprise.organisation.email.find.useQuery(
      {
        organisationId: organisation.id,
        perPage: 100,
      },
      {
        ...DO_NOT_INVALIDATE_QUERY_ON_MUTATION,
      },
    );

  const emails = emailData?.data || [];

  const distributionMethod = watch('meta.distributionMethod');

  const recipientsWithIndex = useMemo(
    () =>
      envelope.recipients.map((recipient, index) => ({
        ...recipient,
        index,
      })),
    [envelope.recipients],
  );

  const recipientsMissingSignatureFields = useMemo(
    () => getRecipientsWithMissingFields(recipientsWithIndex, envelope.fields),
    [recipientsWithIndex, envelope.fields],
  );

  /**
   * List of recipients who must have an email due to having auth enabled.
   */
  const recipientsMissingRequiredEmail = useMemo(() => {
    return recipientsWithIndex.filter((recipient) => {
      const auth = extractDocumentAuthMethods({
        documentAuth: envelope.authOptions,
        recipientAuth: recipient.authOptions,
      });

      return (
        (auth.recipientAccessAuthRequired || auth.recipientActionAuthRequired) && !recipient.email
      );
    });
  }, [recipientsWithIndex, envelope.authOptions]);

  const invalidEnvelopeCode = useMemo(() => {
    if (recipientsMissingSignatureFields.length > 0) {
      return 'MISSING_SIGNATURES';
    }

    if (envelope.recipients.length === 0) {
      return 'MISSING_RECIPIENTS';
    }

    if (recipientsMissingRequiredEmail.length > 0) {
      return 'MISSING_REQUIRED_EMAIL';
    }

    return null;
  }, [envelope.recipients, recipientsMissingRequiredEmail, recipientsMissingSignatureFields]);

  const onFormSubmit = async ({ meta }: TEnvelopeDistributeFormSchema) => {
    try {
      await distributeEnvelope({ envelopeId: envelope.id, meta });

      await onDistribute?.();

      let redirectPath = `${documentRootPath}/${envelope.id}`;

      if (meta.distributionMethod === DocumentDistributionMethod.NONE) {
        redirectPath += '?action=copy-links';
      }

      await navigate(redirectPath);

      toast({
        title: t`Envelope distributed`,
        description: t`Your envelope has been distributed successfully.`,
        duration: 5000,
      });

      setIsOpen(false);
    } catch (err) {
      toast({
        title: t`Something went wrong`,
        description: t`This envelope could not be distributed at this time. Please try again.`,
        variant: 'destructive',
        duration: 7500,
      });
    }
  };

  const handleSync = async () => {
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);

    try {
      await syncEnvelope();
    } catch (err) {
      console.error(err);
    }

    setIsSyncing(false);
  };

  useEffect(() => {
    // Resync the whole envelope if the envelope is mid saving.
    if (isOpen && (isAutosaving || autosaveError)) {
      void handleSync();
    }
  }, [isOpen]);

  if (envelope.status !== DocumentStatus.DRAFT || envelope.type !== EnvelopeType.DOCUMENT) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent
        className={cn(
          'max-w-[28rem]',
          nexisChrome && cn(nexisDistributeDialogContentClassName, 'rounded-xl'),
        )}
        hideClose={!nexisChrome}
      >
        <DialogHeader className={cn(nexisChrome && 'pr-8 text-left')}>
          <DialogTitle className={cn(nexisChrome && 'text-white')}>
            <Trans>Send Document</Trans>
          </DialogTitle>

          <DialogDescription
            className={cn(
              'space-y-2',
              nexisChrome ? 'text-slate-500' : undefined,
              '[&_button]:font-medium',
            )}
          >
            <span className="block">
              <Trans>Recipients will be able to sign the document once sent</Trans>
            </span>
            <span className={cn('block text-sm', !nexisChrome && 'text-muted-foreground')}>
              {distributionMethod === DocumentDistributionMethod.EMAIL ? (
                <>
                  <span className={cn(nexisChrome && 'text-slate-400')}>
                    <Trans>Send via email or</Trans>{' '}
                  </span>
                  <button
                    type="button"
                    className={cn(
                      'underline-offset-2 hover:underline focus:underline focus:outline-none',
                      nexisChrome ? 'text-[#48EAE5]' : 'text-primary',
                    )}
                    onClick={() =>
                      setValue('meta.distributionMethod', DocumentDistributionMethod.NONE)
                    }
                  >
                    <Trans>Generate Link</Trans>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={cn(
                      'underline-offset-2 hover:underline focus:underline focus:outline-none',
                      nexisChrome ? 'text-[#48EAE5]' : 'text-primary',
                    )}
                    onClick={() =>
                      setValue('meta.distributionMethod', DocumentDistributionMethod.EMAIL)
                    }
                  >
                    <Trans>Send via email</Trans>
                  </button>
                  <span className={cn(nexisChrome && 'text-slate-400')}>
                    {' '}
                    <Trans>or Generate Link</Trans>
                  </span>
                </>
              )}
            </span>
          </DialogDescription>
        </DialogHeader>

        {!invalidEnvelopeCode || isSyncing ? (
          <Form {...form}>
            <form onSubmit={handleSubmit(onFormSubmit)}>
              <fieldset disabled={isSubmitting}>
                <div
                  className={cn('min-h-72', {
                    'min-h-[23rem]': organisation.organisationClaim.flags.emailDomains,
                  })}
                >
                  <AnimatePresence initial={false} mode="wait">
                    {isSyncing ? (
                      <motion.div
                        key={'Flushing'}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      >
                        <SpinnerBox spinnerProps={{ size: 'sm' }} className="h-72" />
                      </motion.div>
                    ) : distributionMethod === DocumentDistributionMethod.EMAIL ? (
                      <motion.div
                        key={'Emails'}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      >
                        <Form {...form}>
                          <fieldset
                            className={cn(
                              'mt-2 flex flex-col gap-y-4 rounded-lg',
                              nexisChrome && nexisDistributeDialogFieldShellClassName,
                            )}
                            disabled={form.formState.isSubmitting}
                          >
                            {organisation.organisationClaim.flags.emailDomains && (
                              <FormField
                                control={form.control}
                                name="meta.emailId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      <Trans>Email Sender</Trans>
                                    </FormLabel>
                                    <FormControl>
                                      <Select
                                        {...field}
                                        value={field.value === null ? '-1' : field.value}
                                        onValueChange={(value) =>
                                          field.onChange(value === '-1' ? null : value)
                                        }
                                      >
                                        <SelectTrigger
                                          loading={isLoadingEmails}
                                          className={cn(
                                            'bg-background',
                                            nexisChrome &&
                                              nexisDistributeDialogSelectTriggerClassName,
                                          )}
                                        >
                                          <SelectValue />
                                        </SelectTrigger>

                                        <SelectContent
                                          className={cn(
                                            nexisChrome && nexisRecipientRoleSelectContentClassName,
                                          )}
                                        >
                                          {emails.map((email) => (
                                            <SelectItem key={email.id} value={email.id}>
                                              {email.email}
                                            </SelectItem>
                                          ))}

                                          <SelectItem value={'-1'}>Documenso</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormControl>

                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            <FormField
                              control={form.control}
                              name="meta.emailReplyTo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={cn(nexisChrome && 'sr-only')}>
                                    <Trans>
                                      Reply To Email{' '}
                                      <span className="text-muted-foreground">(Optional)</span>
                                    </Trans>
                                  </FormLabel>

                                  <FormControl>
                                    <Input
                                      {...field}
                                      maxLength={254}
                                      placeholder={nexisChrome ? t`Reply to Email..` : undefined}
                                      className={cn(
                                        nexisChrome && nexisDistributeDialogPillInputClassName,
                                      )}
                                    />
                                  </FormControl>

                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="meta.subject"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={cn(nexisChrome && 'sr-only')}>
                                    <Trans>
                                      Subject{' '}
                                      <span className="text-muted-foreground">(Optional)</span>
                                    </Trans>
                                  </FormLabel>

                                  <FormControl>
                                    <Input
                                      {...field}
                                      maxLength={255}
                                      placeholder={nexisChrome ? t`Subject...` : undefined}
                                      className={cn(
                                        nexisChrome && nexisDistributeDialogPillInputClassName,
                                      )}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="meta.message"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel
                                    className={cn(
                                      'flex flex-row items-center',
                                      nexisChrome && 'sr-only',
                                    )}
                                  >
                                    <Trans>
                                      Message{' '}
                                      <span className="text-muted-foreground">(Optional)</span>
                                    </Trans>
                                    {!nexisChrome && (
                                      <Tooltip>
                                        <TooltipTrigger type="button">
                                          <InfoIcon className="mx-2 h-4 w-4" />
                                        </TooltipTrigger>
                                        <TooltipContent className="p-4 text-muted-foreground">
                                          <DocumentSendEmailMessageHelper />
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </FormLabel>

                                  <FormControl>
                                    <Textarea
                                      className={cn(
                                        'mt-2 h-24 resize-none',
                                        !nexisChrome && 'bg-background',
                                        nexisChrome &&
                                          nexisDistributeDialogMessageTextareaClassName,
                                      )}
                                      placeholder={nexisChrome ? t`Message...` : undefined}
                                      {...field}
                                      maxLength={5000}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </fieldset>
                        </Form>
                      </motion.div>
                    ) : distributionMethod === DocumentDistributionMethod.NONE ? (
                      <motion.div
                        key={'Links'}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        className={cn(
                          'rounded-lg border',
                          nexisChrome ? 'min-h-0 border-white/10 bg-white/[0.03] py-6' : 'min-h-60',
                        )}
                      >
                        <div
                          className={cn(
                            'text-center text-sm text-muted-foreground',
                            nexisChrome ? 'px-2 py-2 text-slate-400' : 'py-24',
                          )}
                        >
                          <p>
                            <Trans>We won't send anything to notify recipients.</Trans>
                          </p>

                          <p className="mt-2">
                            <Trans>
                              We will generate signing links for you, which you can send to the
                              recipients through your method of choice.
                            </Trans>
                          </p>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                <DialogFooter
                  className={cn(
                    nexisChrome &&
                      'w-full gap-3 !space-y-0 border-t border-white/10 pt-4 sm:flex-row sm:justify-stretch sm:!space-x-0 [&>button]:min-h-11 [&>button]:flex-1',
                  )}
                >
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant={nexisChrome ? 'outline' : 'secondary'}
                      disabled={isSubmitting}
                      className={cn(nexisChrome && nexisDialogCancelButtonClassName)}
                    >
                      <Trans>Cancel</Trans>
                    </Button>
                  </DialogClose>

                  <Button
                    loading={isSubmitting}
                    disabled={isSyncing}
                    type="submit"
                    variant={nexisChrome ? 'none' : 'default'}
                    className={cn(nexisChrome && nexisPrimaryButtonClassName)}
                  >
                    {distributionMethod === DocumentDistributionMethod.EMAIL ? (
                      <>
                        <Send className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                        <Trans>Send Document</Trans>
                      </>
                    ) : (
                      <>
                        <Link2 className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                        <Trans>Generate Links</Trans>
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </fieldset>
            </form>
          </Form>
        ) : (
          <>
            <Alert
              variant="warning"
              className={cn(
                nexisChrome &&
                  'border-amber-500/30 bg-amber-500/10 text-amber-100 [&_.alert-title]:text-white',
              )}
            >
              {match(invalidEnvelopeCode)
                .with('MISSING_RECIPIENTS', () => (
                  <AlertDescription>
                    <Trans>You need at least one recipient to send a document</Trans>
                  </AlertDescription>
                ))
                .with('MISSING_SIGNATURES', () => (
                  <AlertDescription>
                    <Trans>The following signers are missing signature fields:</Trans>

                    <ul className="ml-2 mt-1 list-inside list-disc">
                      {recipientsMissingSignatureFields.map((recipient) => (
                        <li key={recipient.id}>
                          {recipient.email || recipient.name || t`Recipient ${recipient.index + 1}`}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                ))
                .with('MISSING_REQUIRED_EMAIL', () => (
                  <AlertDescription>
                    <Trans>The following recipients require an email address:</Trans>

                    <ul className="ml-2 mt-1 list-inside list-disc">
                      {recipientsMissingRequiredEmail.map((recipient) => (
                        <li key={recipient.id}>
                          {recipient.email || recipient.name || t`Recipient ${recipient.index + 1}`}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                ))
                .exhaustive()}
            </Alert>

            <DialogFooter className={cn(nexisChrome && 'border-t border-white/10 pt-4')}>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant={nexisChrome ? 'outline' : 'secondary'}
                  className={cn(nexisChrome && nexisDialogCancelButtonClassName)}
                >
                  <Trans>Close</Trans>
                </Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
