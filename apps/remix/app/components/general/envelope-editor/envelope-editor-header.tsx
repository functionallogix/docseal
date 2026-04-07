import { useMemo } from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { DocumentStatus, EnvelopeType, TemplateType } from '@prisma/client';
import {
  AlertTriangleIcon,
  Building2Icon,
  Globe2Icon,
  LockIcon,
  RefreshCwIcon,
  SendIcon,
  SettingsIcon,
} from 'lucide-react';
import { Link } from 'react-router';
import { match } from 'ts-pattern';

import { useCurrentEnvelopeEditor } from '@documenso/lib/client-only/providers/envelope-editor-provider';
import {
  getEnvelopeItemPermissions,
  mapSecondaryIdToTemplateId,
} from '@documenso/lib/utils/envelope';
import { cn } from '@documenso/ui/lib/utils';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Separator } from '@documenso/ui/primitives/separator';

import { EnvelopeDistributeDialog } from '~/components/dialogs/envelope-distribute-dialog';
import { EnvelopeRedistributeDialog } from '~/components/dialogs/envelope-redistribute-dialog';
import { TemplateUseDialog } from '~/components/dialogs/template-use-dialog';
import { BrandingLogo } from '~/components/general/branding-logo';
import { DocumentAttachmentsPopover } from '~/components/general/document/document-attachments-popover';
import { EmbeddedEditorAttachmentPopover } from '~/components/general/document/embedded-editor-attachment-popover';
import { EnvelopeEditorSettingsDialog } from '~/components/general/envelope-editor/envelope-editor-settings-dialog';
import { nexisPrimaryButtonClassName } from '~/utils/nexis-ui';

import { TemplateDirectLinkBadge } from '../template/template-direct-link-badge';
import { useEnvelopeEditorNexisChrome } from './envelope-editor-nexis-chrome-context';
import { EnvelopeItemTitleInput } from './envelope-editor-title-input';

export default function EnvelopeEditorHeader() {
  const { t } = useLingui();
  const nexisChrome = useEnvelopeEditorNexisChrome();

  const {
    envelope,
    isDocument,
    isTemplate,
    isEmbedded,
    updateEnvelope,
    autosaveError,
    relativePath,
    editorConfig,
    flushAutosave,
  } = useCurrentEnvelopeEditor();

  const {
    embedded,
    general: { allowConfigureEnvelopeTitle },
    actions: { allowAttachments, allowDistributing },
  } = editorConfig;

  const envelopeItemPermissions = useMemo(
    () => getEnvelopeItemPermissions(envelope, envelope.recipients),
    [envelope, envelope.recipients],
  );

  const handleCreateEmbeddedEnvelope = async () => {
    const latestEnvelope = await flushAutosave();

    embedded?.onCreate?.(latestEnvelope);
  };

  const handleUpdateEmbeddedEnvelope = async () => {
    const latestEnvelope = await flushAutosave();

    embedded?.onUpdate?.(latestEnvelope);
  };

  const nexisOutlineBtn =
    'border-white/15 bg-black/40 text-white shadow-none hover:bg-white/10 hover:text-white';

  return (
    <nav
      className={cn(
        'w-full border-b px-4 py-3 md:px-6',
        nexisChrome
          ? 'border-white/10 bg-black px-[12px] text-white md:px-[12px]'
          : 'border-border bg-background',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {editorConfig.embedded?.customBrandingLogo ? (
            <img
              src={`/api/branding/logo/team/${envelope.teamId}`}
              alt="Logo"
              className="h-6 w-auto"
            />
          ) : nexisChrome ? (
            <Link
              to="/"
              className="inline-flex shrink-0 items-center rounded-md ring-offset-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#48EAE5] focus-visible:ring-offset-2"
            >
              <img
                src="/static/logo-docseal.svg"
                alt="DocSeal"
                className="h-[22px] w-auto max-w-[min(50vw,10rem)] object-contain object-left"
              />
            </Link>
          ) : (
            <Link to="/">
              <BrandingLogo className="h-6 w-auto" />
            </Link>
          )}
          <Separator orientation="vertical" className={cn('h-6', nexisChrome && 'bg-white/15')} />

          <div className="flex items-center space-x-2">
            <EnvelopeItemTitleInput
              dataTestId="envelope-title-input"
              disabled={!envelopeItemPermissions.canTitleBeChanged || !allowConfigureEnvelopeTitle}
              value={envelope.title}
              onChange={(title) => {
                updateEnvelope({
                  data: {
                    title,
                  },
                });
              }}
              placeholder={t`Envelope Title`}
              className={
                nexisChrome
                  ? 'text-white hover:outline-white/30 focus:outline-[#48EAE5]'
                  : undefined
              }
            />

            {envelope.type === EnvelopeType.TEMPLATE && (
              <>
                {envelope.templateType === TemplateType.PRIVATE && (
                  <Badge variant="secondary">
                    <LockIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-300" />
                    <Trans>Private Template</Trans>
                  </Badge>
                )}
                {envelope.templateType === TemplateType.ORGANISATION && (
                  <Badge variant="orange">
                    <Building2Icon className="mr-2 size-4" />
                    <Trans>Organisation Template</Trans>
                  </Badge>
                )}
                {envelope.templateType === TemplateType.PUBLIC && (
                  <Badge variant="default">
                    <Globe2Icon className="mr-2 h-4 w-4 text-green-500 dark:text-green-300" />
                    <Trans>Public Template</Trans>
                  </Badge>
                )}

                {envelope.directLink?.token && (
                  <TemplateDirectLinkBadge
                    className="py-1"
                    token={envelope.directLink.token}
                    enabled={envelope.directLink.enabled}
                  />
                )}
              </>
            )}

            {envelope.type === EnvelopeType.DOCUMENT &&
              match(envelope.status)
                .with(DocumentStatus.DRAFT, () => (
                  <Badge
                    variant="warning"
                    className={
                      nexisChrome
                        ? 'border-white/10 bg-white/10 font-medium text-slate-200'
                        : undefined
                    }
                  >
                    <Trans>Draft</Trans>
                  </Badge>
                ))
                .with(DocumentStatus.PENDING, () => (
                  <Badge variant="secondary">
                    <Trans>Pending</Trans>
                  </Badge>
                ))
                .with(DocumentStatus.COMPLETED, () => (
                  <Badge variant="default">
                    <Trans>Completed</Trans>
                  </Badge>
                ))
                .with(DocumentStatus.REJECTED, () => (
                  <Badge variant="destructive">
                    <Trans>Rejected</Trans>
                  </Badge>
                ))
                .exhaustive()}

            {autosaveError && (
              <>
                <Badge variant="destructive">
                  <AlertTriangleIcon className="mr-2 h-4 w-4" />
                  <Trans>Sync failed, changes not saved</Trans>
                </Badge>

                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  <Badge variant="destructive">
                    <RefreshCwIcon className="mr-2 h-4 w-4" />
                    <Trans>Reload</Trans>
                  </Badge>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {allowAttachments &&
            (isEmbedded ? (
              <EmbeddedEditorAttachmentPopover buttonSize="sm" />
            ) : (
              <DocumentAttachmentsPopover
                envelopeId={envelope.id}
                buttonSize="sm"
                buttonClassName={nexisChrome ? nexisOutlineBtn : undefined}
              />
            ))}

          {editorConfig.settings && (
            <EnvelopeEditorSettingsDialog
              trigger={
                <Button variant="outline" size="sm" className={cn(nexisChrome && nexisOutlineBtn)}>
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              }
            />
          )}

          {match({ isEmbedded, isDocument, isTemplate, allowDistributing })
            .with({ isEmbedded: false, isDocument: true, allowDistributing: true }, () => (
              <>
                <EnvelopeDistributeDialog
                  documentRootPath={relativePath.documentRootPath}
                  trigger={
                    <Button
                      size="sm"
                      variant={nexisChrome ? 'none' : 'default'}
                      className={cn(nexisChrome && nexisPrimaryButtonClassName)}
                    >
                      <SendIcon className="mr-2 h-4 w-4" />
                      <Trans>Send Document</Trans>
                    </Button>
                  }
                />

                <EnvelopeRedistributeDialog
                  envelope={envelope}
                  trigger={
                    <Button
                      size="sm"
                      variant={nexisChrome ? 'none' : 'default'}
                      className={cn(nexisChrome && nexisPrimaryButtonClassName)}
                    >
                      <SendIcon className="mr-2 h-4 w-4" />
                      <Trans>Resend Document</Trans>
                    </Button>
                  }
                />
              </>
            ))
            .with({ isEmbedded: false, isTemplate: true, allowDistributing: true }, () => (
              <TemplateUseDialog
                envelopeId={envelope.id}
                templateId={mapSecondaryIdToTemplateId(envelope.secondaryId)}
                templateSigningOrder={envelope.documentMeta?.signingOrder}
                recipients={envelope.recipients}
                documentRootPath={relativePath.documentRootPath}
                trigger={
                  <Button
                    size="sm"
                    variant={nexisChrome ? 'none' : 'default'}
                    className={cn(nexisChrome && nexisPrimaryButtonClassName)}
                  >
                    <Trans>Use Template</Trans>
                  </Button>
                }
              />
            ))

            .otherwise(() => null)}

          {embedded?.mode === 'create' && (
            <Button
              size="sm"
              variant={nexisChrome ? 'none' : 'default'}
              className={cn(nexisChrome && nexisPrimaryButtonClassName)}
              onClick={handleCreateEmbeddedEnvelope}
            >
              {isDocument ? <Trans>Create Document</Trans> : <Trans>Create Template</Trans>}
            </Button>
          )}

          {embedded?.mode === 'edit' && (
            <Button
              size="sm"
              variant={nexisChrome ? 'none' : 'default'}
              className={cn(nexisChrome && nexisPrimaryButtonClassName)}
              onClick={handleUpdateEmbeddedEnvelope}
            >
              {isDocument ? <Trans>Update Document</Trans> : <Trans>Update Template</Trans>}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
