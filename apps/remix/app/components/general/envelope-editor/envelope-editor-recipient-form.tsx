import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DragDropContext,
  Draggable,
  type DropResult,
  Droppable,
  type SensorAPI,
} from '@hello-pangea/dnd';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { DocumentSigningOrder, EnvelopeType, RecipientRole, SendStatus } from '@prisma/client';
import { motion } from 'framer-motion';
import { GripVerticalIcon, HelpCircleIcon, PlusIcon, SparklesIcon, TrashIcon } from 'lucide-react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { useRevalidator, useSearchParams } from 'react-router';
import { isDeepEqual } from 'remeda';

import { useLimits } from '@documenso/ee/server-only/limits/provider/client';
import { useDebouncedValue } from '@documenso/lib/client-only/hooks/use-debounced-value';
import { ZEditorRecipientsFormSchema } from '@documenso/lib/client-only/hooks/use-editor-recipients';
import { useCurrentEnvelopeEditor } from '@documenso/lib/client-only/providers/envelope-editor-provider';
import { useCurrentOrganisation } from '@documenso/lib/client-only/providers/organisation';
import { useOptionalSession } from '@documenso/lib/client-only/providers/session';
import type { TDetectedRecipientSchema } from '@documenso/lib/server-only/ai/envelope/detect-recipients/schema';
import { ZRecipientAuthOptionsSchema } from '@documenso/lib/types/document-auth';
import { nanoid } from '@documenso/lib/universal/id';
import { canRecipientBeModified as utilCanRecipientBeModified } from '@documenso/lib/utils/recipients';
import { trpc } from '@documenso/trpc/react';
import { RecipientActionAuthSelect } from '@documenso/ui/components/recipient/recipient-action-auth-select';
import {
  RecipientAutoCompleteInput,
  type RecipientAutoCompleteOption,
} from '@documenso/ui/components/recipient/recipient-autocomplete-input';
import { RecipientRoleSelect } from '@documenso/ui/components/recipient/recipient-role-select';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@documenso/ui/primitives/card';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { SigningOrderConfirmation } from '@documenso/ui/primitives/document-flow/signing-order-confirmation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form/form';
import { FormErrorMessage } from '@documenso/ui/primitives/form/form-error-message';
import { Input } from '@documenso/ui/primitives/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@documenso/ui/primitives/tooltip';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { AiFeaturesEnableDialog } from '~/components/dialogs/ai-features-enable-dialog';
import { AiRecipientDetectionDialog } from '~/components/dialogs/ai-recipient-detection-dialog';
import { useCurrentTeam } from '~/providers/team';
import {
  nexisCheckboxCheckClassName,
  nexisCheckboxClassName,
  nexisEnvelopeActionIconSrc,
  nexisEnvelopeRecipientInputClassName,
  nexisRecipientAutocompletePopoverClassName,
  nexisRecipientRoleSelectContentClassName,
  nexisRecipientRoleSelectItemClassName,
  nexisRecipientRoleTooltipContentClassName,
} from '~/utils/nexis-ui';

import { useEnvelopeEditorNexisChrome } from './envelope-editor-nexis-chrome-context';

const nexisOutlineBtnClass =
  'border-white/15 bg-black/40 text-white shadow-none hover:bg-white/10 hover:text-white';

/** Same height as `Input` (h-10) for a level row with role trigger + trash. */
const nexisRecipientRowActionBtnClass =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-none border-0 bg-transparent px-0 text-white shadow-none hover:bg-white/[0.08] hover:text-white focus-visible:ring-1 focus-visible:ring-[#48EAE5] focus-visible:ring-offset-0 disabled:opacity-40';

const nexisRoleTriggerClass =
  'h-10 w-[50px] shrink-0 justify-center gap-0.5 border-white/15 bg-[#141414] px-1.5 py-0 text-white hover:bg-white/10 hover:text-white focus:ring-[#48EAE5] [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-white [&_svg.lucide-chevron-down]:text-slate-400';

export const EnvelopeEditorRecipientForm = () => {
  const nexisChrome = useEnvelopeEditorNexisChrome();

  const {
    envelope,
    setRecipientsDebounced,
    updateEnvelope,
    editorRecipients,
    isEmbedded,
    editorConfig,
  } = useCurrentEnvelopeEditor();

  const organisation = useCurrentOrganisation();
  const team = useCurrentTeam();

  const { t } = useLingui();
  const { toast } = useToast();
  const { remaining } = useLimits();
  const { sessionData } = useOptionalSession();

  const user = sessionData?.user;

  const [searchParams, setSearchParams] = useSearchParams();
  const [recipientSearchQuery, setRecipientSearchQuery] = useState('');
  const [isAiEnableDialogOpen, setIsAiEnableDialogOpen] = useState(false);

  // AI recipient detection dialog state
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(() => searchParams.get('ai') === 'true');
  const { revalidate } = useRevalidator();

  const onAiDialogOpenChange = (open: boolean) => {
    if (open && !team.preferences.aiFeaturesEnabled) {
      setIsAiEnableDialogOpen(true);
      setIsAiDialogOpen(false);
      return;
    }

    setIsAiDialogOpen(open);

    if (!open && searchParams.get('ai') === 'true') {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);

          newParams.delete('ai');

          return newParams;
        },
        { replace: true },
      );
    }
  };

  const onDetectRecipientsClick = () => {
    if (!team.preferences.aiFeaturesEnabled) {
      setIsAiEnableDialogOpen(true);
      return;
    }

    setIsAiDialogOpen(true);
  };

  const onAiFeaturesEnabled = () => {
    void revalidate().then(() => {
      setIsAiEnableDialogOpen(false);
      setIsAiDialogOpen(true);
    });
  };

  const debouncedRecipientSearchQuery = useDebouncedValue(recipientSearchQuery, 500);

  const $sensorApi = useRef<SensorAPI | null>(null);
  const isFirstRender = useRef(true);
  const { recipients, fields } = envelope;

  const { data: recipientSuggestionsData, isLoading } = trpc.recipient.suggestions.find.useQuery(
    {
      query: debouncedRecipientSearchQuery,
    },
    {
      enabled: debouncedRecipientSearchQuery.length > 1 && !isEmbedded,
      retry: false,
    },
  );

  const recipientSuggestions = recipientSuggestionsData?.results || [];

  const { form } = editorRecipients;

  const recipientHasAuthSettings = useMemo(() => {
    const recipientHasAuthOptions = recipients.find((recipient) => {
      const recipientAuthOptions = ZRecipientAuthOptionsSchema.parse(recipient.authOptions);

      return (
        recipientAuthOptions.accessAuth.length > 0 || recipientAuthOptions.actionAuth.length > 0
      );
    });

    const formHasActionAuth = form
      .getValues('signers')
      .find((signer) => signer.actionAuth.length > 0);

    return recipientHasAuthOptions !== undefined || formHasActionAuth !== undefined;
  }, [recipients, form]);

  const [showAdvancedSettings, setShowAdvancedSettings] = useState(recipientHasAuthSettings);
  const [showSigningOrderConfirmation, setShowSigningOrderConfirmation] = useState(false);

  const {
    setValue,
    formState: { errors, isSubmitting },
    control,
    watch,
  } = form;

  const formValues = useWatch({
    control,
  });

  const watchedSigners = watch('signers');
  const isSigningOrderSequential = watch('signingOrder') === DocumentSigningOrder.SEQUENTIAL;

  const hasAssistantRole = useMemo(() => {
    return watchedSigners.some((signer) => signer.role === RecipientRole.ASSISTANT);
  }, [watchedSigners]);

  const normalizeSigningOrders = (signers: typeof watchedSigners) => {
    return signers
      .sort((a, b) => (a.signingOrder ?? 0) - (b.signingOrder ?? 0))
      .map((signer, index) => ({ ...signer, signingOrder: index + 1 }));
  };

  const {
    append: appendSigner,
    fields: signers,
    remove: removeSigner,
  } = useFieldArray({
    control,
    name: 'signers',
    keyName: 'nativeId',
  });

  const emptySignerIndex = watchedSigners.findIndex(
    (signer) =>
      !signer.name &&
      !signer.email &&
      envelope.fields.filter((field) => field.recipientId === signer.id).length === 0,
  );

  const isUserAlreadyARecipient = watchedSigners.some(
    (signer) => signer.email.toLowerCase() === user?.email?.toLowerCase(),
  );

  const hasDocumentBeenSent = recipients.some(
    (recipient) => recipient.role !== RecipientRole.CC && recipient.sendStatus === SendStatus.SENT,
  );

  const canRecipientBeModified = (recipientId?: number) => {
    if (envelope.type === EnvelopeType.TEMPLATE) {
      return true;
    }

    if (recipientId === undefined) {
      return true;
    }

    const recipient = recipients.find((recipient) => recipient.id === recipientId);

    if (!recipient) {
      return false;
    }

    return utilCanRecipientBeModified(recipient, fields);
  };

  const onAddSigner = () => {
    appendSigner({
      formId: nanoid(12),
      name: '',
      email: '',
      role: RecipientRole.SIGNER,
      actionAuth: [],
      signingOrder: signers.length > 0 ? (signers[signers.length - 1]?.signingOrder ?? 0) + 1 : 1,
    });
  };

  const onAiDetectionComplete = (detectedRecipients: TDetectedRecipientSchema[]) => {
    const currentSigners = form.getValues('signers');

    let nextSigningOrder =
      currentSigners.length > 0
        ? Math.max(...currentSigners.map((s) => s.signingOrder ?? 0)) + 1
        : 1;

    // If the only signer is the default empty signer lets just replace it with the detected recipients
    if (currentSigners.length === 1 && !currentSigners[0].name && !currentSigners[0].email) {
      form.setValue(
        'signers',
        detectedRecipients.map((recipient, index) => ({
          formId: nanoid(12),
          name: recipient.name,
          email: recipient.email,
          role: recipient.role,
          actionAuth: [],
          signingOrder: index + 1,
        })),
        {
          shouldValidate: true,
          shouldDirty: true,
        },
      );

      return;
    }

    for (const recipient of detectedRecipients) {
      const emailExists = currentSigners.some(
        (s) => s.email.toLowerCase() === recipient.email.toLowerCase(),
      );

      const nameExists = currentSigners.some(
        (s) => s.name.toLowerCase() === recipient.name.toLowerCase(),
      );

      if ((emailExists && recipient.email) || (nameExists && recipient.name)) {
        continue;
      }

      currentSigners.push({
        formId: nanoid(12),
        name: recipient.name,
        email: recipient.email,
        role: recipient.role,
        actionAuth: [],
        signingOrder: nextSigningOrder,
      });

      nextSigningOrder += 1;
    }

    form.setValue('signers', normalizeSigningOrders(currentSigners), {
      shouldValidate: true,
      shouldDirty: true,
    });

    toast({
      title: plural(detectedRecipients.length, {
        one: `Recipient added`,
        other: `Recipients added`,
      }),
      description: plural(detectedRecipients.length, {
        one: `# recipient have been added from AI detection.`,
        other: `# recipients have been added from AI detection.`,
      }),
    });
  };

  const onRemoveSigner = (index: number) => {
    const signer = signers[index];

    if (!canRecipientBeModified(signer.id)) {
      toast({
        title: t`Cannot remove signer`,
        description: t`This signer has already signed the document.`,
        variant: 'destructive',
      });

      return;
    }

    const formStateIndex = form.getValues('signers').findIndex((s) => s.formId === signer.formId);
    if (formStateIndex !== -1) {
      removeSigner(formStateIndex);

      const updatedSigners = form.getValues('signers').filter((s) => s.formId !== signer.formId);

      form.setValue('signers', normalizeSigningOrders(updatedSigners), {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const onAddSelfSigner = () => {
    if (emptySignerIndex !== -1) {
      setValue(`signers.${emptySignerIndex}.name`, user?.name ?? '', {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue(`signers.${emptySignerIndex}.email`, user?.email ?? '', {
        shouldValidate: true,
        shouldDirty: true,
      });

      form.setFocus(`signers.${emptySignerIndex}.email`);
    } else {
      appendSigner(
        {
          formId: nanoid(12),
          name: user?.name ?? '',
          email: user?.email ?? '',
          role: RecipientRole.SIGNER,
          actionAuth: [],
          signingOrder:
            signers.length > 0 ? (signers[signers.length - 1]?.signingOrder ?? 0) + 1 : 1,
        },
        {
          shouldFocus: true,
        },
      );

      void form.trigger('signers');
    }
  };

  const handleRecipientAutoCompleteSelect = (
    index: number,
    suggestion: RecipientAutoCompleteOption,
  ) => {
    setValue(`signers.${index}.email`, suggestion.email, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue(`signers.${index}.name`, suggestion.name || '', {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;

      const items = Array.from(watchedSigners);
      const [reorderedSigner] = items.splice(result.source.index, 1);

      // Find next valid position
      let insertIndex = result.destination.index;
      while (insertIndex < items.length && !canRecipientBeModified(items[insertIndex].id)) {
        insertIndex++;
      }

      items.splice(insertIndex, 0, reorderedSigner);

      const updatedSigners = items.map((signer, index) => ({
        ...signer,
        signingOrder: !canRecipientBeModified(signer.id) ? signer.signingOrder : index + 1,
      }));

      form.setValue('signers', updatedSigners, {
        shouldValidate: true,
        shouldDirty: true,
      });

      const lastSigner = updatedSigners[updatedSigners.length - 1];
      if (lastSigner.role === RecipientRole.ASSISTANT) {
        toast({
          title: t`Warning: Assistant as last signer`,
          description: t`Having an assistant as the last signer means they will be unable to take any action as there are no subsequent signers to assist.`,
        });
      }

      await form.trigger('signers');
    },
    [form, canRecipientBeModified, watchedSigners, toast],
  );

  const handleRoleChange = useCallback(
    (index: number, role: RecipientRole) => {
      const currentSigners = form.getValues('signers');
      const signingOrder = form.getValues('signingOrder');

      // Handle parallel to sequential conversion for assistants
      if (role === RecipientRole.ASSISTANT && signingOrder === DocumentSigningOrder.PARALLEL) {
        form.setValue('signingOrder', DocumentSigningOrder.SEQUENTIAL, {
          shouldValidate: true,
          shouldDirty: true,
        });
        toast({
          title: t`Signing order is enabled.`,
          description: t`You cannot add assistants when signing order is disabled.`,
          variant: 'destructive',
        });
        return;
      }

      const updatedSigners = currentSigners.map((signer, idx) => ({
        ...signer,
        role: idx === index ? role : signer.role,
        signingOrder: !canRecipientBeModified(signer.id) ? signer.signingOrder : idx + 1,
      }));

      form.setValue('signers', updatedSigners, {
        shouldValidate: true,
        shouldDirty: true,
      });

      if (role === RecipientRole.ASSISTANT && index === updatedSigners.length - 1) {
        toast({
          title: t`Warning: Assistant as last signer`,
          description: t`Having an assistant as the last signer means they will be unable to take any action as there are no subsequent signers to assist.`,
        });
      }
    },
    [form, toast, canRecipientBeModified],
  );

  const handleSigningOrderChange = useCallback(
    (index: number, newOrderString: string) => {
      const trimmedOrderString = newOrderString.trim();
      if (!trimmedOrderString) {
        return;
      }

      const newOrder = Number(trimmedOrderString);
      if (!Number.isInteger(newOrder) || newOrder < 1) {
        return;
      }

      const currentSigners = form.getValues('signers');
      const signer = currentSigners[index];

      // Remove signer from current position and insert at new position
      const remainingSigners = currentSigners.filter((_, idx) => idx !== index);
      const newPosition = Math.min(Math.max(0, newOrder - 1), currentSigners.length - 1);
      remainingSigners.splice(newPosition, 0, signer);

      const updatedSigners = remainingSigners.map((s, idx) => ({
        ...s,
        signingOrder: !canRecipientBeModified(s.id) ? s.signingOrder : idx + 1,
      }));

      form.setValue('signers', updatedSigners, {
        shouldValidate: true,
        shouldDirty: true,
      });

      if (signer.role === RecipientRole.ASSISTANT && newPosition === remainingSigners.length - 1) {
        toast({
          title: t`Warning: Assistant as last signer`,
          description: t`Having an assistant as the last signer means they will be unable to take any action as there are no subsequent signers to assist.`,
        });
      }
    },
    [form, canRecipientBeModified, toast],
  );

  const handleSigningOrderDisable = useCallback(() => {
    setShowSigningOrderConfirmation(false);

    const currentSigners = form.getValues('signers');
    const updatedSigners = currentSigners.map((signer) => ({
      ...signer,
      role: signer.role === RecipientRole.ASSISTANT ? RecipientRole.SIGNER : signer.role,
    }));

    form.setValue('signers', updatedSigners, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue('signingOrder', DocumentSigningOrder.PARALLEL, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.setValue('allowDictateNextSigner', false, {
      shouldValidate: true,
      shouldDirty: true,
    });

    void form.trigger();
  }, [form]);

  // Dupecode/Inefficient: Done because native isValid won't work for our usecase.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const validatedFormValues = ZEditorRecipientsFormSchema.safeParse(formValues);

    if (!validatedFormValues.success) {
      return;
    }

    const { data } = validatedFormValues;

    // Weird edge case where the whole envelope is created via API
    // with no signing order. If they come to this page it will show an error
    // since they aren't equal and the recipient is no longer editable.
    const envelopeRecipients = data.signers.map((recipient) => {
      if (!canRecipientBeModified(recipient.id)) {
        return {
          ...recipient,
          signingOrder: recipient.signingOrder,
        };
      }
      return recipient;
    });

    const hasSigningOrderChanged = envelope.documentMeta.signingOrder !== data.signingOrder;
    const hasAllowDictateNextSignerChanged =
      envelope.documentMeta.allowDictateNextSigner !== data.allowDictateNextSigner;

    const hasSignersChanged =
      envelopeRecipients.length !== recipients.length ||
      envelopeRecipients.some((signer) => {
        const recipient = recipients.find((recipient) => recipient.id === signer.id);

        if (!recipient) {
          return true;
        }

        const signerActionAuth = signer.actionAuth;
        const recipientActionAuth = recipient.authOptions?.actionAuth || [];

        return (
          signer.email !== recipient.email ||
          signer.name !== recipient.name ||
          signer.role !== recipient.role ||
          signer.signingOrder !== recipient.signingOrder ||
          !isDeepEqual(signerActionAuth, recipientActionAuth)
        );
      });

    if (hasSignersChanged) {
      setRecipientsDebounced(envelopeRecipients);
    }

    if (hasSigningOrderChanged || hasAllowDictateNextSignerChanged) {
      updateEnvelope({
        meta: {
          signingOrder: validatedFormValues.data.signingOrder,
          allowDictateNextSigner: validatedFormValues.data.allowDictateNextSigner,
        },
      });
    }
  }, [formValues]);

  return (
    <Card
      backdropBlur={false}
      className={cn(
        'border',
        nexisChrome && 'rounded-xl border-white/10 bg-[#000000] shadow-none dark:shadow-none',
      )}
    >
      <CardHeader
        className={cn(
          'flex flex-row justify-between pb-3',
          nexisChrome && 'border-b border-white/10 pb-4',
        )}
      >
        <div>
          <CardTitle className={cn(nexisChrome && 'text-white')}>
            <Trans>Recipients</Trans>
          </CardTitle>
          <CardDescription className={cn('mt-1.5', nexisChrome && 'text-slate-500')}>
            <Trans>Add recipients to your document</Trans>
          </CardDescription>
        </div>

        <div className="flex flex-row items-center space-x-2">
          {editorConfig.recipients?.allowAIDetection && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  disabled={isSubmitting}
                  className={cn(nexisChrome && nexisOutlineBtnClass)}
                  onClick={onDetectRecipientsClick}
                >
                  <SparklesIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>

              <TooltipContent>
                {team.preferences.aiFeaturesEnabled ? (
                  <Trans>Detect recipients with AI</Trans>
                ) : (
                  <Trans>Enable AI detection</Trans>
                )}
              </TooltipContent>
            </Tooltip>
          )}

          {!isEmbedded && (
            <Button
              variant="outline"
              className={cn('flex flex-row items-center', nexisChrome && nexisOutlineBtnClass)}
              size="sm"
              disabled={isSubmitting || isUserAlreadyARecipient}
              onClick={() => onAddSelfSigner()}
            >
              <Trans>Add Myself</Trans>
            </Button>
          )}

          <Button
            variant="outline"
            type="button"
            className={cn('flex-1 bg-[#212529]', nexisChrome && nexisOutlineBtnClass)}
            size="sm"
            disabled={isSubmitting || signers.length >= remaining.recipients}
            onClick={() => onAddSigner()}
          >
            <PlusIcon className="-ml-1 mr-1 h-5 w-5" />
            <Trans>Add Signer</Trans>
          </Button>
        </div>
      </CardHeader>

      <CardContent className={cn(nexisChrome && 'px-6 pb-6')}>
        <Form {...form}>
          <div
            className={cn(
              'mb-2 space-y-4',
              nexisChrome
                ? 'mt-6 border-b border-white/10 pb-6'
                : '-mt-2 rounded-md bg-accent/50 p-4',
              {
                hidden:
                  !editorConfig.recipients?.allowConfigureSigningOrder &&
                  !organisation.organisationClaim.flags.cfr21,
              },
            )}
          >
            {organisation.organisationClaim.flags.cfr21 && (
              <div className="flex flex-row items-center">
                <Checkbox
                  id="showAdvancedRecipientSettings"
                  checked={showAdvancedSettings}
                  onCheckedChange={(value) => setShowAdvancedSettings(Boolean(value))}
                  className={cn(nexisChrome && nexisCheckboxClassName)}
                  checkClassName={nexisChrome ? nexisCheckboxCheckClassName : undefined}
                />

                <label
                  className="ml-2 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="showAdvancedRecipientSettings"
                >
                  <Trans>Show advanced settings</Trans>
                </label>
              </div>
            )}

            {editorConfig.recipients?.allowConfigureSigningOrder && (
              <FormField
                control={form.control}
                name="signingOrder"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        {...field}
                        id="signingOrder"
                        checked={field.value === DocumentSigningOrder.SEQUENTIAL}
                        onCheckedChange={(checked) => {
                          if (!checked && hasAssistantRole) {
                            setShowSigningOrderConfirmation(true);
                            return;
                          }

                          field.onChange(
                            checked
                              ? DocumentSigningOrder.SEQUENTIAL
                              : DocumentSigningOrder.PARALLEL,
                          );

                          // If sequential signing is turned off, disable dictate next signer
                          if (!checked) {
                            form.setValue('allowDictateNextSigner', false, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }
                        }}
                        disabled={isSubmitting || hasDocumentBeenSent}
                        className={cn(nexisChrome && nexisCheckboxClassName)}
                        checkClassName={nexisChrome ? nexisCheckboxCheckClassName : undefined}
                      />
                    </FormControl>

                    <div className="flex items-center text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      <FormLabel
                        htmlFor="signingOrder"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        <Trans>Enable signing order</Trans>
                      </FormLabel>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-help text-muted-foreground">
                            <HelpCircleIcon className="h-3.5 w-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-80 p-4">
                          <p>
                            <Trans>Add 2 or more signers to enable signing order.</Trans>
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {isSigningOrderSequential && (
              <FormField
                control={form.control}
                name="allowDictateNextSigner"
                render={({ field: { value, ...field } }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        {...field}
                        id="allowDictateNextSigner"
                        className={cn(nexisChrome && nexisCheckboxClassName)}
                        checkClassName={nexisChrome ? nexisCheckboxCheckClassName : undefined}
                        checked={value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                        }}
                        disabled={isSubmitting || hasDocumentBeenSent || !isSigningOrderSequential}
                      />
                    </FormControl>

                    <div className="flex items-center text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      <FormLabel
                        htmlFor="allowDictateNextSigner"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        <Trans>Allow signers to dictate next signer</Trans>
                      </FormLabel>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-help text-muted-foreground">
                            <HelpCircleIcon className="h-3.5 w-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-80 p-4">
                          <p>
                            <Trans>
                              When enabled, signers can choose who should sign next in the sequence
                              instead of following the predefined order.
                            </Trans>
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </div>

          <div
            className={cn(
              nexisChrome &&
                (editorConfig.recipients?.allowConfigureSigningOrder ||
                organisation.organisationClaim.flags.cfr21
                  ? 'pt-6'
                  : 'mt-6 border-t border-white/10 pt-6'),
            )}
          >
            <DragDropContext
              onDragEnd={onDragEnd}
              sensors={[
                (api: SensorAPI) => {
                  $sensorApi.current = api;
                },
              ]}
            >
              <Droppable droppableId="signers">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={cn('flex w-full flex-col', nexisChrome ? 'gap-y-0' : 'gap-y-2')}
                  >
                    {signers.map((signer, index) => {
                      const isDirectRecipient =
                        envelope.type === EnvelopeType.TEMPLATE &&
                        envelope.directLink !== null &&
                        signer.id === envelope.directLink.directTemplateRecipientId;

                      return (
                        <Draggable
                          key={`${signer.nativeId}-${signer.signingOrder}`}
                          draggableId={signer['nativeId']}
                          index={index}
                          isDragDisabled={
                            !isSigningOrderSequential ||
                            isSubmitting ||
                            !canRecipientBeModified(signer.id) ||
                            !signer.signingOrder
                          }
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                nexisChrome &&
                                  '-mx-6 border-b border-white/10 px-6 transition-colors hover:bg-white/[0.04]',
                                nexisChrome && index === signers.length - 1 && 'border-b-0',
                                nexisChrome ? 'py-2' : 'py-1',
                                {
                                  'pointer-events-none rounded-md bg-widget-foreground pt-2':
                                    snapshot.isDragging && !nexisChrome,
                                  'pointer-events-none py-2 opacity-90':
                                    snapshot.isDragging && nexisChrome,
                                },
                              )}
                            >
                              <motion.fieldset
                                data-native-id={signer.id}
                                disabled={isSubmitting || !canRecipientBeModified(signer.id)}
                                className={cn(
                                  nexisChrome && 'm-0 min-w-0 border-0 p-0 shadow-none',
                                  !nexisChrome && 'pb-2',
                                  {
                                    'border-b pb-4':
                                      !nexisChrome &&
                                      showAdvancedSettings &&
                                      index !== signers.length - 1,
                                    'pt-2': showAdvancedSettings && index === 0 && !nexisChrome,
                                    'pr-3': isSigningOrderSequential && !nexisChrome,
                                  },
                                )}
                              >
                                <div
                                  className={cn(
                                    'flex flex-row items-center',
                                    nexisChrome ? 'gap-x-3' : 'gap-x-2',
                                  )}
                                >
                                  {isSigningOrderSequential && (
                                    <FormField
                                      control={form.control}
                                      name={`signers.${index}.signingOrder`}
                                      render={({ field }) => (
                                        <FormItem
                                          className={cn(
                                            'flex items-center gap-x-1 space-y-0',
                                            !nexisChrome && 'mt-auto',
                                            {
                                              'mb-6':
                                                form.formState.errors.signers?.[index] &&
                                                !form.formState.errors.signers[index]?.signingOrder,
                                            },
                                          )}
                                        >
                                          <div
                                            {...provided.dragHandleProps}
                                            className="flex shrink-0 cursor-grab touch-none items-center active:cursor-grabbing"
                                          >
                                            <GripVerticalIcon className="h-5 w-5 flex-shrink-0 opacity-40" />
                                          </div>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              max={signers.length}
                                              data-testid="signing-order-input"
                                              className={cn(
                                                'w-10 text-center',
                                                '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
                                                nexisChrome && nexisEnvelopeRecipientInputClassName,
                                              )}
                                              {...field}
                                              onChange={(e) => {
                                                field.onChange(e);
                                                handleSigningOrderChange(index, e.target.value);
                                              }}
                                              onBlur={(e) => {
                                                field.onBlur();
                                                handleSigningOrderChange(index, e.target.value);
                                              }}
                                              disabled={
                                                snapshot.isDragging ||
                                                isSubmitting ||
                                                !canRecipientBeModified(signer.id)
                                              }
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )}

                                  <FormField
                                    control={form.control}
                                    name={`signers.${index}.email`}
                                    render={({ field }) => (
                                      <FormItem
                                        className={cn(
                                          'relative w-full',
                                          nexisChrome &&
                                            'flex min-w-0 flex-1 flex-col justify-center space-y-0',
                                          {
                                            'mb-6':
                                              form.formState.errors.signers?.[index] &&
                                              !form.formState.errors.signers[index]?.email,
                                          },
                                        )}
                                      >
                                        {!showAdvancedSettings && index === 0 && (
                                          <FormLabel
                                            className={cn(
                                              nexisChrome && 'sr-only',
                                              !nexisChrome && 'text-foreground',
                                            )}
                                          >
                                            <Trans>Email</Trans>
                                          </FormLabel>
                                        )}

                                        <FormControl>
                                          <RecipientAutoCompleteInput
                                            type="email"
                                            placeholder={t`Email`}
                                            value={field.value}
                                            disabled={
                                              snapshot.isDragging ||
                                              isSubmitting ||
                                              !canRecipientBeModified(signer.id) ||
                                              isDirectRecipient
                                            }
                                            options={recipientSuggestions}
                                            onSelect={(suggestion) =>
                                              handleRecipientAutoCompleteSelect(index, suggestion)
                                            }
                                            onSearchQueryChange={(query) => {
                                              field.onChange(query);
                                              setRecipientSearchQuery(query);
                                            }}
                                            loading={isLoading}
                                            data-testid="signer-email-input"
                                            maxLength={254}
                                            className={
                                              nexisChrome
                                                ? nexisEnvelopeRecipientInputClassName
                                                : undefined
                                            }
                                            popoverContentClassName={
                                              nexisChrome
                                                ? nexisRecipientAutocompletePopoverClassName
                                                : undefined
                                            }
                                          />
                                        </FormControl>

                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`signers.${index}.name`}
                                    render={({ field }) => (
                                      <FormItem
                                        className={cn(
                                          'w-full',
                                          nexisChrome &&
                                            'flex min-w-0 flex-1 flex-col justify-center space-y-0',
                                          {
                                            'mb-6':
                                              form.formState.errors.signers?.[index] &&
                                              !form.formState.errors.signers[index]?.name,
                                          },
                                        )}
                                      >
                                        {!showAdvancedSettings && index === 0 && (
                                          <FormLabel
                                            className={cn(
                                              nexisChrome && 'sr-only',
                                              !nexisChrome && 'text-foreground',
                                            )}
                                          >
                                            <Trans>Name</Trans>
                                          </FormLabel>
                                        )}

                                        <FormControl>
                                          <RecipientAutoCompleteInput
                                            type="text"
                                            placeholder={t`Recipient ${index + 1}`}
                                            {...field}
                                            disabled={
                                              snapshot.isDragging ||
                                              isSubmitting ||
                                              !canRecipientBeModified(signer.id) ||
                                              isDirectRecipient
                                            }
                                            options={recipientSuggestions}
                                            onSelect={(suggestion) =>
                                              handleRecipientAutoCompleteSelect(index, suggestion)
                                            }
                                            onSearchQueryChange={(query) => {
                                              field.onChange(query);
                                              setRecipientSearchQuery(query);
                                            }}
                                            loading={isLoading}
                                            maxLength={255}
                                            className={
                                              nexisChrome
                                                ? nexisEnvelopeRecipientInputClassName
                                                : undefined
                                            }
                                            popoverContentClassName={
                                              nexisChrome
                                                ? nexisRecipientAutocompletePopoverClassName
                                                : undefined
                                            }
                                          />
                                        </FormControl>

                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={form.control}
                                    name={`signers.${index}.role`}
                                    render={({ field }) => (
                                      <FormItem
                                        className={cn(
                                          'w-fit',
                                          nexisChrome
                                            ? 'flex shrink-0 flex-col justify-center self-center'
                                            : 'mt-auto',
                                          {
                                            'mb-6':
                                              form.formState.errors.signers?.[index] &&
                                              !form.formState.errors.signers[index]?.role,
                                          },
                                        )}
                                      >
                                        <FormControl>
                                          <RecipientRoleSelect
                                            {...field}
                                            hideAssistantRole={
                                              !editorConfig.recipients?.allowAssistantRole
                                            }
                                            hideCCerRole={!editorConfig.recipients?.allowCCerRole}
                                            hideViewerRole={
                                              !editorConfig.recipients?.allowViewerRole
                                            }
                                            hideApproverRole={
                                              !editorConfig.recipients?.allowApproverRole
                                            }
                                            isAssistantEnabled={isSigningOrderSequential}
                                            triggerClassName={
                                              nexisChrome ? nexisRoleTriggerClass : undefined
                                            }
                                            contentClassName={
                                              nexisChrome
                                                ? nexisRecipientRoleSelectContentClassName
                                                : undefined
                                            }
                                            itemClassName={
                                              nexisChrome
                                                ? nexisRecipientRoleSelectItemClassName
                                                : undefined
                                            }
                                            tooltipContentClassName={
                                              nexisChrome
                                                ? nexisRecipientRoleTooltipContentClassName
                                                : undefined
                                            }
                                            onValueChange={(value) => {
                                              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                                              handleRoleChange(index, value as RecipientRole);
                                              field.onChange(value);
                                            }}
                                            disabled={
                                              snapshot.isDragging ||
                                              isSubmitting ||
                                              !canRecipientBeModified(signer.id)
                                            }
                                          />
                                        </FormControl>

                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  {nexisChrome ? (
                                    <div className="ml-auto flex h-10 shrink-0 items-center border-l border-white/10 pl-3">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={nexisRecipientRowActionBtnClass}
                                        data-testid="remove-signer-button"
                                        disabled={
                                          snapshot.isDragging ||
                                          isSubmitting ||
                                          !canRecipientBeModified(signer.id) ||
                                          signers.length === 1 ||
                                          isDirectRecipient
                                        }
                                        onClick={() => onRemoveSigner(index)}
                                      >
                                        <img
                                          src={nexisEnvelopeActionIconSrc.trash}
                                          alt=""
                                          className="h-5 w-5"
                                          aria-hidden
                                        />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      className={cn('mt-auto px-2', {
                                        'mb-6': form.formState.errors.signers?.[index],
                                      })}
                                      data-testid="remove-signer-button"
                                      disabled={
                                        snapshot.isDragging ||
                                        isSubmitting ||
                                        !canRecipientBeModified(signer.id) ||
                                        signers.length === 1 ||
                                        isDirectRecipient
                                      }
                                      onClick={() => onRemoveSigner(index)}
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>

                                {showAdvancedSettings &&
                                  organisation.organisationClaim.flags.cfr21 && (
                                    <FormField
                                      control={form.control}
                                      name={`signers.${index}.actionAuth`}
                                      render={({ field }) => (
                                        <FormItem
                                          className={cn('mt-2 w-full', {
                                            'mb-6':
                                              form.formState.errors.signers?.[index] &&
                                              !form.formState.errors.signers[index]?.actionAuth,
                                            'pl-6': isSigningOrderSequential,
                                          })}
                                        >
                                          <FormControl>
                                            <RecipientActionAuthSelect
                                              {...field}
                                              onValueChange={field.onChange}
                                              disabled={
                                                snapshot.isDragging ||
                                                isSubmitting ||
                                                !canRecipientBeModified(signer.id)
                                              }
                                            />
                                          </FormControl>

                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )}
                              </motion.fieldset>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          <FormErrorMessage
            className="mt-2"
            // Dirty hack to handle errors when .root is populated for an array type
            error={'signers__root' in errors && errors['signers__root']}
          />
        </Form>

        <SigningOrderConfirmation
          open={showSigningOrderConfirmation}
          onOpenChange={setShowSigningOrderConfirmation}
          onConfirm={handleSigningOrderDisable}
        />

        {editorConfig.recipients?.allowAIDetection && (
          <AiRecipientDetectionDialog
            open={isAiDialogOpen}
            onOpenChange={onAiDialogOpenChange}
            onComplete={onAiDetectionComplete}
            envelopeId={envelope.id}
            teamId={envelope.teamId}
          />
        )}

        <AiFeaturesEnableDialog
          open={isAiEnableDialogOpen}
          onOpenChange={setIsAiEnableDialogOpen}
          onEnabled={onAiFeaturesEnabled}
        />
      </CardContent>
    </Card>
  );
};
