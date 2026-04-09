import { useState } from 'react';

import { useLingui } from '@lingui/react/macro';
import { Trans } from '@lingui/react/macro';
import { EnvelopeType } from '@prisma/client';
import { useNavigate } from 'react-router';

import { formatDocumentsPath, formatTemplatesPath } from '@documenso/lib/utils/teams';
import { trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
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

import { useCurrentTeam } from '~/providers/team';
import { nexisDeleteDialogContentClassName } from '~/utils/nexis-ui';
import { useNexisDarkDialogButtons } from '~/utils/use-nexis-dark-dialog-buttons';

type EnvelopeDuplicateDialogProps = {
  envelopeId: string;
  envelopeType: EnvelopeType;
  trigger?: React.ReactNode;
};

export const EnvelopeDuplicateDialog = ({
  envelopeId,
  envelopeType,
  trigger,
}: EnvelopeDuplicateDialogProps) => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const { toast } = useToast();
  const { t } = useLingui();

  const team = useCurrentTeam();

  const nexisBtns = useNexisDarkDialogButtons();

  const { mutateAsync: duplicateEnvelope, isPending: isDuplicating } =
    trpc.envelope.duplicate.useMutation({
      onSuccess: async ({ id }) => {
        toast({
          title: t`Envelope Duplicated`,
          description: t`Your envelope has been successfully duplicated.`,
          duration: 5000,
        });

        const path =
          envelopeType === EnvelopeType.DOCUMENT
            ? formatDocumentsPath(team.url)
            : formatTemplatesPath(team.url);

        await navigate(`${path}/${id}/edit`);
        setOpen(false);
      },
    });

  const onDuplicate = async () => {
    try {
      await duplicateEnvelope({ envelopeId });
    } catch {
      toast({
        title: t`Something went wrong`,
        description: t`This document could not be duplicated at this time. Please try again.`,
        variant: 'destructive',
        duration: 7500,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !isDuplicating && setOpen(value)}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        className={cn(nexisBtns.active && nexisDeleteDialogContentClassName)}
        hideClose={!nexisBtns.active}
      >
        {envelopeType === EnvelopeType.DOCUMENT ? (
          <DialogHeader className={cn(nexisBtns.active && 'pr-8 text-left')}>
            <DialogTitle className={cn(nexisBtns.active && 'text-white')}>
              <Trans>Duplicate Document</Trans>
            </DialogTitle>
            <DialogDescription className={cn(nexisBtns.active && 'text-slate-400')}>
              <Trans>This document will be duplicated.</Trans>
            </DialogDescription>
          </DialogHeader>
        ) : (
          <DialogHeader className={cn(nexisBtns.active && 'pr-8 text-left')}>
            <DialogTitle className={cn(nexisBtns.active && 'text-white')}>
              <Trans>Duplicate Template</Trans>
            </DialogTitle>
            <DialogDescription className={cn(nexisBtns.active && 'text-slate-400')}>
              <Trans>This template will be duplicated.</Trans>
            </DialogDescription>
          </DialogHeader>
        )}

        <DialogFooter
          className={cn(
            nexisBtns.active &&
              'w-full gap-3 !space-y-0 border-t border-white/10 pt-4 sm:flex-row sm:justify-stretch sm:!space-x-0 [&>button]:min-h-11 [&>button]:flex-1',
          )}
        >
          <div
            className={cn(
              'flex w-full flex-nowrap gap-4 sm:flex-row',
              nexisBtns.active && 'gap-3 [&_button]:min-h-11 [&_button]:flex-1',
            )}
          >
            <Button
              type="button"
              variant={nexisBtns.cancelVariant}
              className={cn(
                'flex-1',
                !nexisBtns.active &&
                  'bg-black/5 hover:bg-black/10 dark:bg-muted dark:hover:bg-muted/80',
                nexisBtns.cancelClassName,
              )}
              disabled={isDuplicating}
              onClick={() => setOpen(false)}
            >
              <Trans>Cancel</Trans>
            </Button>

            <Button
              type="button"
              loading={isDuplicating}
              variant={nexisBtns.primaryVariant}
              className={cn('flex-1', nexisBtns.primaryClassName)}
              onClick={onDuplicate}
            >
              <Trans>Duplicate</Trans>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
