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

type TemplateDuplicateDialogProps = {
  id: number;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
};

export const TemplateDuplicateDialog = ({
  id,
  open,
  onOpenChange,
}: TemplateDuplicateDialogProps) => {
  const { _ } = useLingui();
  const { toast } = useToast();

  const nexisBtns = useNexisDarkDialogButtons();

  const { mutateAsync: duplicateTemplate, isPending } =
    trpcReact.template.duplicateTemplate.useMutation({
      onSuccess: () => {
        toast({
          title: _(msg`Template duplicated`),
          description: _(msg`Your template has been duplicated successfully.`),
          duration: 5000,
        });

        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: _(msg`Error`),
          description: _(msg`An error occurred while duplicating template.`),
          variant: 'destructive',
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
            <Trans>Do you want to duplicate this template?</Trans>
          </DialogTitle>

          <DialogDescription className={cn('pt-2', nexisBtns.active && 'text-slate-400')}>
            <Trans>Your template will be duplicated.</Trans>
          </DialogDescription>
        </DialogHeader>

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
              disabled={isPending}
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
              loading={isPending}
              variant={nexisBtns.primaryVariant}
              className={cn('flex-1', nexisBtns.primaryClassName)}
              onClick={async () =>
                duplicateTemplate({
                  templateId: id,
                })
              }
            >
              <Trans>Duplicate</Trans>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
