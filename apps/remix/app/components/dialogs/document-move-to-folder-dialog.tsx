import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import type * as DialogPrimitive from '@radix-ui/react-dialog';
import { FolderIcon, HomeIcon, Loader2, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { FolderType } from '@documenso/lib/types/folder-type';
import { formatDocumentsPath } from '@documenso/lib/utils/teams';
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
import { useToast } from '@documenso/ui/primitives/use-toast';

import { useCurrentTeam } from '~/providers/team';
import {
  nexisDeleteDialogContentClassName,
  nexisDistributeDialogPillInputClassName,
  nexisPrimaryButtonClassName,
} from '~/utils/nexis-ui';
import { useNexisDarkDialogButtons } from '~/utils/use-nexis-dark-dialog-buttons';

const nexisMoveDocumentFolderListButtonInactiveClassName = cn(
  'min-h-11 w-full justify-start rounded-lg border border-[#495057] !bg-[#212529] font-normal !text-white shadow-none',
  'hover:!bg-white/5 hover:!text-white',
);

export type DocumentMoveToFolderDialogProps = {
  documentId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolderId?: string;
} & Omit<DialogPrimitive.DialogProps, 'children'>;

const ZMoveDocumentFormSchema = z.object({
  folderId: z.string().nullable().optional(),
});

type TMoveDocumentFormSchema = z.infer<typeof ZMoveDocumentFormSchema>;

export const DocumentMoveToFolderDialog = ({
  documentId,
  open,
  onOpenChange,
  currentFolderId,
  ...props
}: DocumentMoveToFolderDialogProps) => {
  const { _ } = useLingui();
  const { toast } = useToast();

  const navigate = useNavigate();
  const team = useCurrentTeam();

  const nexisBtns = useNexisDarkDialogButtons();

  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<TMoveDocumentFormSchema>({
    resolver: zodResolver(ZMoveDocumentFormSchema),
    defaultValues: {
      folderId: currentFolderId,
    },
  });

  const { data: folders, isLoading: isFoldersLoading } = trpc.folder.findFoldersInternal.useQuery(
    {
      parentId: currentFolderId,
      type: FolderType.DOCUMENT,
    },
    {
      enabled: open,
    },
  );

  const { mutateAsync: updateDocument } = trpc.document.update.useMutation();

  useEffect(() => {
    if (!open) {
      form.reset();
      setSearchTerm('');
    } else {
      form.reset({ folderId: currentFolderId });
    }
  }, [open, currentFolderId, form]);

  const onSubmit = async (data: TMoveDocumentFormSchema) => {
    try {
      await updateDocument({
        documentId,
        data: {
          folderId: data.folderId ?? null,
        },
      });

      const documentsPath = formatDocumentsPath(team.url);

      if (data.folderId) {
        await navigate(`${documentsPath}/f/${data.folderId}`);
      } else {
        await navigate(documentsPath);
      }

      toast({
        title: _(msg`Document moved`),
        description: _(msg`The document has been moved successfully.`),
        variant: 'default',
      });

      onOpenChange(false);
    } catch (err) {
      const error = AppError.parseError(err);

      if (error.code === AppErrorCode.NOT_FOUND) {
        toast({
          title: _(msg`Error`),
          description: _(msg`The folder you are trying to move the document to does not exist.`),
          variant: 'destructive',
        });

        return;
      }

      if (error.code === AppErrorCode.UNAUTHORIZED) {
        toast({
          title: _(msg`Error`),
          description: _(msg`You are not allowed to move this document.`),
          variant: 'destructive',
        });

        return;
      }

      toast({
        title: _(msg`Error`),
        description: _(msg`An error occurred while moving the document.`),
        variant: 'destructive',
      });
    }
  };

  const filteredFolders = folders?.data.filter((folder) =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Dialog {...props} open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          nexisBtns.active && nexisDeleteDialogContentClassName,
          nexisBtns.active && 'max-w-lg',
        )}
      >
        <DialogHeader className={cn(nexisBtns.active && 'pr-8 text-left')}>
          <DialogTitle className={cn(nexisBtns.active && 'text-white')}>
            <Trans>Move Document to Folder</Trans>
          </DialogTitle>

          <DialogDescription className={cn(nexisBtns.active && 'text-slate-500')}>
            <Trans>Select a folder to move this document to.</Trans>
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className={cn(
              'absolute h-4 w-4',
              nexisBtns.active
                ? 'pointer-events-none left-4 top-1/2 -translate-y-1/2 text-slate-500'
                : 'left-2 top-3 text-muted-foreground',
            )}
          />
          <Input
            placeholder={_(msg`Search folders...`)}
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
            <FormField
              control={form.control}
              name="folderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(nexisBtns.active && 'text-slate-400')}>
                    <Trans>Folder</Trans>
                  </FormLabel>

                  <FormControl>
                    <div className="max-h-96 space-y-2 overflow-y-auto">
                      {isFoldersLoading ? (
                        <div className="flex h-10 items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant={
                              nexisBtns.active
                                ? 'none'
                                : field.value === null
                                  ? 'default'
                                  : 'outline'
                            }
                            className={cn(
                              'w-full justify-start',
                              nexisBtns.active &&
                                (field.value === null
                                  ? nexisPrimaryButtonClassName
                                  : nexisMoveDocumentFolderListButtonInactiveClassName),
                            )}
                            onClick={() => field.onChange(null)}
                            disabled={currentFolderId === null}
                          >
                            <HomeIcon className="mr-2 h-4 w-4 shrink-0" />
                            <Trans>Home (No Folder)</Trans>
                          </Button>

                          {filteredFolders?.map((folder) => (
                            <Button
                              key={folder.id}
                              type="button"
                              variant={
                                nexisBtns.active
                                  ? 'none'
                                  : field.value === folder.id
                                    ? 'default'
                                    : 'outline'
                              }
                              className={cn(
                                'w-full justify-start',
                                nexisBtns.active &&
                                  (field.value === folder.id
                                    ? nexisPrimaryButtonClassName
                                    : nexisMoveDocumentFolderListButtonInactiveClassName),
                              )}
                              onClick={() => field.onChange(folder.id)}
                              disabled={currentFolderId === folder.id}
                            >
                              <FolderIcon className="mr-2 h-4 w-4 shrink-0" />
                              {folder.name}
                            </Button>
                          ))}

                          {searchTerm && filteredFolders?.length === 0 && (
                            <div className="px-2 py-2 text-center text-sm text-muted-foreground">
                              <Trans>No folders found</Trans>
                            </div>
                          )}
                        </>
                      )}
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
                disabled={
                  isFoldersLoading || form.formState.isSubmitting || currentFolderId === null
                }
                variant={nexisBtns.primaryVariant}
                className={nexisBtns.primaryClassName}
              >
                <Trans>Move</Trans>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
