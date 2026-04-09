import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';

import { trpc as trpcReact } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@documenso/ui/primitives/dialog';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { nexisDeleteDialogContentClassName } from '~/utils/nexis-ui';
import { useNexisDarkDialogButtons } from '~/utils/use-nexis-dark-dialog-buttons';

type TemplateDeleteDialogProps = {
  id: number;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onDelete?: () => Promise<void> | void;
};

export const TemplateDeleteDialog = ({
  id,
  open,
  onOpenChange,
  onDelete,
}: TemplateDeleteDialogProps) => {
  const { _ } = useLingui();
  const { toast } = useToast();

  const nexisBtns = useNexisDarkDialogButtons();

  const { mutateAsync: deleteTemplate, isPending } = trpcReact.template.deleteTemplate.useMutation({
    onSuccess: async () => {
      await onDelete?.();

      toast({
        title: _(msg`Template deleted`),
        description: _(msg`Your template has been successfully deleted.`),
        duration: 5000,
      });

      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: _(msg`Something went wrong`),
        description: _(msg`This template could not be deleted at this time. Please try again.`),
        variant: 'destructive',
        duration: 7500,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(value) => !isPending && onOpenChange(value)}>
      <DialogContent
        className={cn(nexisBtns.active && nexisDeleteDialogContentClassName)}
        hideClose={!nexisBtns.active}
      >
        <DialogHeader className={cn(nexisBtns.active && 'pr-8 text-left')}>
          <DialogTitle className={cn(nexisBtns.active && 'text-white')}>
            <Trans>Do you want to delete this template?</Trans>
          </DialogTitle>

          <DialogDescription className={cn(nexisBtns.active && 'text-slate-400')}>
            <Trans>
              Please note that this action is irreversible. Once confirmed, your template will be
              permanently deleted.
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
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            <Trans>Cancel</Trans>
          </Button>

          <Button
            type="button"
            variant={nexisBtns.destructiveVariant}
            className={nexisBtns.destructiveClassName}
            loading={isPending}
            onClick={async () => deleteTemplate({ templateId: id })}
          >
            <Trans>Delete</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
