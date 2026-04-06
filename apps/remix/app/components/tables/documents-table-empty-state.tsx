import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { CheckCircle2, RotateCw } from 'lucide-react';
import { match } from 'ts-pattern';

import { ExtendedDocumentStatus } from '@documenso/prisma/types/extended-document-status';
import { cn } from '@documenso/ui/lib/utils';

export type DocumentsTableEmptyStateProps = {
  status: ExtendedDocumentStatus;
  nexisChrome?: boolean;
};

export const DocumentsTableEmptyState = ({
  status,
  nexisChrome,
}: DocumentsTableEmptyStateProps) => {
  const { _ } = useLingui();

  const {
    title,
    message,
    icon: Icon,
  } = match(status)
    .with(ExtendedDocumentStatus.COMPLETED, () => ({
      title: msg`Nothing to do`,
      message: msg`There are no completed documents yet. Documents that you have created or received will appear here once completed.`,
      icon: CheckCircle2,
    }))
    .with(ExtendedDocumentStatus.DRAFT, () => ({
      title: msg`No active drafts`,
      message: msg`There are no active drafts at the current moment. You can upload a document to start drafting.`,
      icon: CheckCircle2,
    }))
    .with(ExtendedDocumentStatus.ALL, () => ({
      title: msg`We're all empty`,
      message: msg`You have not yet created or received any documents. To create a document please upload one.`,
      icon: RotateCw,
    }))
    .otherwise(() => ({
      title: msg`Nothing to do`,
      message: msg`All documents have been processed. Any new documents that are sent or received will show here.`,
      icon: CheckCircle2,
    }));

  return (
    <div
      className={cn(
        'flex h-60 flex-col items-center justify-center gap-y-4',
        nexisChrome ? 'text-slate-500' : 'text-muted-foreground/60',
      )}
      data-testid="empty-document-state"
    >
      <Icon className="h-12 w-12" strokeWidth={1.5} />

      <div className="text-center">
        <h3 className={cn('text-lg font-semibold', nexisChrome ? 'text-slate-200' : undefined)}>
          {_(title)}
        </h3>

        <p className={cn('mt-2 max-w-[60ch]', nexisChrome && 'text-slate-500')}>{_(message)}</p>
      </div>
    </div>
  );
};
