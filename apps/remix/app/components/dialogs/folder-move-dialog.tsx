import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { Trans } from '@lingui/react/macro';
import type * as DialogPrimitive from '@radix-ui/react-dialog';
import { FolderIcon, HomeIcon, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { trpc } from '@documenso/trpc/react';
import type { TFolderWithSubfolders } from '@documenso/trpc/server/folder-router/schema';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@documenso/ui/primitives/form/form';
import { Input } from '@documenso/ui/primitives/input';
import { useToast } from '@documenso/ui/primitives/use-toast';

import {
  nexisDeleteDialogContentClassName,
  nexisDistributeDialogPillInputClassName,
  nexisPrimaryButtonClassName,
} from '~/utils/nexis-ui';
import { useNexisDarkDialogButtons } from '~/utils/use-nexis-dark-dialog-buttons';

const nexisMoveFolderListButtonInactiveClassName = cn(
  'min-h-11 w-full justify-start rounded-lg border border-[#495057] !bg-[#212529] font-normal !text-white shadow-none',
  'hover:!bg-white/5 hover:!text-white',
);

export type FolderMoveDialogProps = {
  foldersData: TFolderWithSubfolders[] | undefined;
  folder: TFolderWithSubfolders | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
} & Omit<DialogPrimitive.DialogProps, 'children'>;

const ZMoveFolderFormSchema = z.object({
  targetFolderId: z.string().nullable(),
});

type TMoveFolderFormSchema = z.infer<typeof ZMoveFolderFormSchema>;

export const FolderMoveDialog = ({
  foldersData,
  folder,
  isOpen,
  onOpenChange,
}: FolderMoveDialogProps) => {
  const { t } = useLingui();
  const { toast } = useToast();

  const nexisBtns = useNexisDarkDialogButtons();
  const [searchTerm, setSearchTerm] = useState('');

  const { mutateAsync: moveFolder } = trpc.folder.updateFolder.useMutation();

  const form = useForm<TMoveFolderFormSchema>({
    resolver: zodResolver(ZMoveFolderFormSchema),
    defaultValues: {
      targetFolderId: folder?.parentId ?? null,
    },
  });

  const onFormSubmit = async ({ targetFolderId }: TMoveFolderFormSchema) => {
    if (!folder) {
      return;
    }

    try {
      await moveFolder({
        folderId: folder.id,
        data: {
          parentId: targetFolderId || null,
        },
      });

      onOpenChange(false);

      toast({
        title: t`Folder moved successfully`,
      });
    } catch (err) {
      const error = AppError.parseError(err);

      if (error.code === AppErrorCode.NOT_FOUND) {
        toast({
          title: t`Folder not found`,
          description: t`The folder you are trying to move does not exist.`,
          variant: 'destructive',
        });

        return;
      }

      toast({
        title: t`Failed to move folder`,
        description: t`An unknown error occurred while moving the folder.`,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setSearchTerm('');
    }
  }, [isOpen, form]);

  // Filter out the current folder, only show folders of the same type, and filter by search term
  const filteredFolders = foldersData?.filter(
    (f) =>
      f.id !== folder?.id &&
      f.type === folder?.type &&
      (searchTerm === '' || f.name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          nexisBtns.active && nexisDeleteDialogContentClassName,
          nexisBtns.active && 'max-w-lg',
        )}
      >
        <DialogHeader className={cn(nexisBtns.active && 'pr-8 text-left')}>
          <DialogTitle className={cn(nexisBtns.active && 'text-white')}>
            <Trans>Move Folder</Trans>
          </DialogTitle>
          <DialogDescription className={cn(nexisBtns.active && 'text-slate-500')}>
            <Trans>Select a destination for this folder.</Trans>
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className={cn(
              'pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2',
              nexisBtns.active ? 'text-slate-500' : 'text-muted-foreground',
            )}
          />
          <Input
            placeholder={t`Search folders...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'pl-8',
              nexisBtns.active && nexisDistributeDialogPillInputClassName,
              nexisBtns.active && 'w-full !pl-10',
            )}
          />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)}>
            <fieldset disabled={form.formState.isSubmitting} className="space-y-4">
              <FormField
                control={form.control}
                name="targetFolderId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="max-h-96 space-y-2 overflow-y-auto">
                        <Button
                          type="button"
                          variant={nexisBtns.active ? 'none' : !field.value ? 'default' : 'outline'}
                          className={cn(
                            'w-full justify-start',
                            nexisBtns.active &&
                              (!field.value
                                ? nexisPrimaryButtonClassName
                                : nexisMoveFolderListButtonInactiveClassName),
                          )}
                          disabled={!folder?.parentId}
                          onClick={() => field.onChange(null)}
                        >
                          <HomeIcon className="mr-2 h-4 w-4 shrink-0" />
                          <Trans>Home</Trans>
                        </Button>

                        {filteredFolders &&
                          filteredFolders.map((f) => (
                            <Button
                              key={f.id}
                              type="button"
                              disabled={f.id === folder?.parentId}
                              variant={
                                nexisBtns.active
                                  ? 'none'
                                  : field.value === f.id
                                    ? 'default'
                                    : 'outline'
                              }
                              className={cn(
                                'w-full justify-start',
                                nexisBtns.active &&
                                  (field.value === f.id
                                    ? nexisPrimaryButtonClassName
                                    : nexisMoveFolderListButtonInactiveClassName),
                              )}
                              onClick={() => field.onChange(f.id)}
                            >
                              <FolderIcon className="mr-2 h-4 w-4 shrink-0" />
                              {f.name}
                            </Button>
                          ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  onClick={() => onOpenChange(false)}
                >
                  <Trans>Cancel</Trans>
                </Button>
                <Button
                  type="submit"
                  loading={form.formState.isSubmitting}
                  variant={nexisBtns.primaryVariant}
                  className={nexisBtns.primaryClassName}
                >
                  <Trans>Move</Trans>
                </Button>
              </DialogFooter>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
