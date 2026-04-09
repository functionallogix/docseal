import { useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { Trans } from '@lingui/react/macro';

import { trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { Alert, AlertDescription } from '@documenso/ui/primitives/alert';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
import { useToast } from '@documenso/ui/primitives/use-toast';

import {
  nexisDeleteDialogContentClassName,
  nexisDeleteDialogWarningClassName,
} from '~/utils/nexis-ui';
import { useNexisDarkDialogButtons } from '~/utils/use-nexis-dark-dialog-buttons';

export type EnvelopeItemDeleteDialogProps = {
  canItemBeDeleted: boolean;
  envelopeId: string;
  envelopeItemId: string;
  envelopeItemTitle: string;
  onDelete?: (envelopeItemId: string) => void;
  trigger?: React.ReactNode;
};

export const EnvelopeItemDeleteDialog = ({
  trigger,
  canItemBeDeleted,
  envelopeId,
  envelopeItemId,
  envelopeItemTitle,
  onDelete,
}: EnvelopeItemDeleteDialogProps) => {
  const [open, setOpen] = useState(false);

  const { t } = useLingui();
  const { toast } = useToast();

  const nexisBtns = useNexisDarkDialogButtons();

  const { mutateAsync: deleteEnvelopeItem, isPending: isDeleting } =
    trpc.envelope.item.delete.useMutation({
      onSuccess: () => {
        toast({
          title: t`Success`,
          description: t`You have successfully removed this envelope item.`,
          duration: 5000,
        });

        onDelete?.(envelopeItemId);

        setOpen(false);
      },
      onError: () => {
        toast({
          title: t`An unknown error occurred`,
          description: t`We encountered an unknown error while attempting to remove this envelope item. Please try again later.`,
          variant: 'destructive',
          duration: 10000,
        });
      },
    });

  return (
    <Dialog open={open} onOpenChange={(value) => !isDeleting && setOpen(value)}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      {canItemBeDeleted ? (
        <DialogContent
          position="center"
          className={cn(nexisBtns.active && nexisDeleteDialogContentClassName)}
          hideClose={!nexisBtns.active}
        >
          <DialogHeader className={cn(nexisBtns.active && 'pr-8 text-left')}>
            <DialogTitle className={cn(nexisBtns.active && 'text-white')}>
              <Trans>Are you sure?</Trans>
            </DialogTitle>

            <DialogDescription className={cn('mt-4', nexisBtns.active && 'text-slate-400')}>
              <Trans>
                You are about to remove the following document and all associated fields
              </Trans>
            </DialogDescription>
          </DialogHeader>

          <Alert
            variant="neutral"
            className={cn(nexisBtns.active && nexisDeleteDialogWarningClassName)}
          >
            <AlertDescription
              className={cn('text-start font-semibold', nexisBtns.active && '!text-slate-100')}
            >
              {envelopeItemTitle}
            </AlertDescription>
          </Alert>

          <fieldset disabled={isDeleting}>
            <DialogFooter
              className={cn(
                nexisBtns.active &&
                  'w-full gap-3 !space-y-0 border-t border-white/10 pt-4 sm:flex-row sm:justify-stretch sm:!space-x-0 [&>button]:min-h-11 [&>button]:flex-1',
              )}
            >
              <Button
                type="button"
                variant={nexisBtns.cancelVariant}
                className={nexisBtns.cancelClassName}
                onClick={() => setOpen(false)}
              >
                <Trans>Cancel</Trans>
              </Button>

              <Button
                type="submit"
                variant={nexisBtns.destructiveVariant}
                className={nexisBtns.destructiveClassName}
                loading={isDeleting}
                onClick={async () =>
                  deleteEnvelopeItem({
                    envelopeId,
                    envelopeItemId,
                  })
                }
              >
                <Trans>Delete</Trans>
              </Button>
            </DialogFooter>
          </fieldset>
        </DialogContent>
      ) : (
        <DialogContent
          position="center"
          className={cn(nexisBtns.active && nexisDeleteDialogContentClassName)}
          hideClose={!nexisBtns.active}
        >
          <DialogHeader className={cn(nexisBtns.active && 'pr-8 text-left')}>
            <DialogTitle className={cn(nexisBtns.active && 'text-white')}>
              <Trans>This item cannot be deleted</Trans>
            </DialogTitle>

            <DialogDescription className={cn('mt-4', nexisBtns.active && 'text-slate-400')}>
              <Trans>
                You cannot delete this item because the document has been sent to recipients.
              </Trans>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter
            className={cn(
              nexisBtns.active &&
                'w-full gap-3 !space-y-0 border-t border-white/10 pt-4 sm:flex-row sm:justify-stretch sm:!space-x-0 [&>button]:min-h-11 [&>button]:flex-1',
            )}
          >
            <Button
              type="button"
              variant={nexisBtns.cancelVariant}
              className={nexisBtns.cancelClassName}
              onClick={() => setOpen(false)}
            >
              <Trans>Close</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};
