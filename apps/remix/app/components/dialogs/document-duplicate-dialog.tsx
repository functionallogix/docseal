import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useNavigate } from 'react-router';

import { formatDocumentsPath } from '@documenso/lib/utils/teams';
import { trpc as trpcReact } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@documenso/ui/primitives/dialog';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { useCurrentTeam } from '~/providers/team';
import { nexisDeleteDialogContentClassName } from '~/utils/nexis-ui';
import { useNexisDarkDialogButtons } from '~/utils/use-nexis-dark-dialog-buttons';

type DocumentDuplicateDialogProps = {
  id: string;
  token?: string;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
};

export const DocumentDuplicateDialog = ({
  id,
  token,
  open,
  onOpenChange,
}: DocumentDuplicateDialogProps) => {
  const navigate = useNavigate();

  const { toast } = useToast();
  const { _ } = useLingui();

  const nexisBtns = useNexisDarkDialogButtons();

  const team = useCurrentTeam();

  const documentsPath = formatDocumentsPath(team.url);

  const { mutateAsync: duplicateEnvelope, isPending: isDuplicating } =
    trpcReact.envelope.duplicate.useMutation({
      onSuccess: async ({ id }) => {
        toast({
          title: _(msg`Document Duplicated`),
          description: _(msg`Your document has been successfully duplicated.`),
          duration: 5000,
        });

        await navigate(`${documentsPath}/${id}/edit`);
        onOpenChange(false);
      },
    });

  const onDuplicate = async () => {
    try {
      await duplicateEnvelope({ envelopeId: id });
    } catch {
      toast({
        title: _(msg`Something went wrong`),
        description: _(msg`This document could not be duplicated at this time. Please try again.`),
        variant: 'destructive',
        duration: 7500,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !isDuplicating && onOpenChange(value)}>
      <DialogContent
        className={cn(nexisBtns.active && nexisDeleteDialogContentClassName)}
        hideClose={!nexisBtns.active}
      >
        <DialogHeader className={cn(nexisBtns.active && 'pr-8 text-left')}>
          <DialogTitle className={cn(nexisBtns.active && 'text-white')}>
            <Trans>Duplicate</Trans>
          </DialogTitle>
        </DialogHeader>

        <DialogFooter
          className={cn(
            nexisBtns.active &&
              'w-full gap-3 !space-y-0 border-t border-white/10 pt-4 sm:flex-row sm:justify-stretch sm:!space-x-0 [&>button]:min-h-11 [&>button]:flex-1',
          )}
        >
          <div
            className={cn(
              'flex w-full flex-1 flex-nowrap gap-4',
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
              onClick={() => onOpenChange(false)}
            >
              <Trans>Cancel</Trans>
            </Button>

            <Button
              type="button"
              disabled={isDuplicating}
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
