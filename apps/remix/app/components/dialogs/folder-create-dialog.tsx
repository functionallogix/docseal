import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import type { FolderType } from '@prisma/client';
import type * as DialogPrimitive from '@radix-ui/react-dialog';
import { FolderPlusIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { z } from 'zod';

import { trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

import {
  nexisDistributeDialogContentClassName,
  nexisDistributeDialogPillInputClassName,
  nexisPrimaryButtonClassName,
} from '~/utils/nexis-ui';

const ZCreateFolderFormSchema = z.object({
  name: z.string().min(1, { message: 'Folder name is required' }),
});

type TCreateFolderFormSchema = z.infer<typeof ZCreateFolderFormSchema>;

export type FolderCreateDialogProps = {
  type: FolderType;
  trigger?: React.ReactNode;
  /** Merged onto the default trigger button when `trigger` is omitted. */
  triggerButtonClassName?: string;
  parentFolderId?: string | null;
  /** Dark Nexis dashboard — pill field + full-width Create (no Cancel). */
  nexisChrome?: boolean;
} & Omit<DialogPrimitive.DialogProps, 'children'>;

export const FolderCreateDialog = ({
  type,
  trigger,
  triggerButtonClassName,
  parentFolderId,
  nexisChrome = false,
  ...props
}: FolderCreateDialogProps) => {
  const { t } = useLingui();
  const { toast } = useToast();
  const { folderId } = useParams();

  const parentId = parentFolderId ?? folderId;

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

  const { mutateAsync: createFolder } = trpc.folder.createFolder.useMutation();

  const form = useForm<TCreateFolderFormSchema>({
    resolver: zodResolver(ZCreateFolderFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data: TCreateFolderFormSchema) => {
    try {
      await createFolder({
        name: data.name,
        parentId,
        type,
      });

      setIsCreateFolderOpen(false);

      toast({
        description: t`Folder created successfully`,
      });
    } catch (err) {
      toast({
        title: t`Failed to create folder`,
        description: t`An unknown error occurred while creating the folder.`,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (!isCreateFolderOpen) {
      form.reset();
    }
  }, [isCreateFolderOpen, form]);

  return (
    <Dialog {...props} open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            className={cn('flex items-center', triggerButtonClassName)}
            data-testid="folder-create-button"
          >
            <FolderPlusIcon className="mr-2 h-4 w-4" />
            <Trans>Create Folder</Trans>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        className={cn(
          nexisChrome && 'max-w-[28rem]',
          nexisChrome && nexisDistributeDialogContentClassName,
          nexisChrome && 'rounded-xl',
        )}
        hideClose={nexisChrome}
      >
        <DialogHeader className={cn(nexisChrome && 'pr-8 text-left')}>
          <DialogTitle className={cn(nexisChrome && 'text-white')}>
            <Trans>Create New Folder</Trans>
          </DialogTitle>
          <DialogDescription className={cn(nexisChrome ? 'text-slate-500' : undefined)}>
            <Trans>Enter a name for your new folder. Folders help you organise your items.</Trans>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={form.formState.isSubmitting} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={cn(nexisChrome && 'sr-only')}>
                      <Trans>Folder Name</Trans>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={nexisChrome ? t`Folder Name` : t`My Folder`}
                        className={cn(
                          nexisChrome && nexisDistributeDialogPillInputClassName,
                          nexisChrome && 'w-full',
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={cn(nexisChrome ? 'mt-6 w-full' : 'mt-2')}>
                <Button
                  type="submit"
                  variant={nexisChrome ? 'none' : 'default'}
                  loading={form.formState.isSubmitting}
                  className={cn(
                    nexisChrome
                      ? cn(nexisPrimaryButtonClassName, 'h-11 min-h-11 w-full rounded-lg')
                      : 'w-full',
                  )}
                >
                  <Trans>Create</Trans>
                </Button>
              </div>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
