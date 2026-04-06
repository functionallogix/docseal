import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Trans } from '@lingui/react/macro';
import { FolderType } from '@prisma/client';
import { ChevronLeft, ChevronRight, FolderIcon, HomeIcon } from 'lucide-react';
import { Link } from 'react-router';

import { useCurrentOrganisation } from '@documenso/lib/client-only/providers/organisation';
import { formatDocumentsPath, formatTemplatesPath } from '@documenso/lib/utils/teams';
import { trpc } from '@documenso/trpc/react';
import { type TFolderWithSubfolders } from '@documenso/trpc/server/folder-router/schema';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import { Skeleton } from '@documenso/ui/primitives/skeleton';

import { FolderCreateDialog } from '~/components/dialogs/folder-create-dialog';
import { FolderDeleteDialog } from '~/components/dialogs/folder-delete-dialog';
import { FolderMoveDialog } from '~/components/dialogs/folder-move-dialog';
import { FolderUpdateDialog } from '~/components/dialogs/folder-update-dialog';
import { DocumentUploadButtonLegacy } from '~/components/general/document/document-upload-button-legacy';
import { FolderCard, FolderCardEmpty } from '~/components/general/folder/folder-card';
import { useCurrentTeam } from '~/providers/team';
import { nexisPrimaryButtonClassName } from '~/utils/nexis-ui';

import { EnvelopeUploadButton } from '../envelope/envelope-upload-button';

export type FolderGridProps = {
  type: FolderType;
  parentId: string | null;
  /** Nexis MOS dashboard styling (dark cards + chrome). */
  nexisChrome?: boolean;
};

const NEXIS_FOLDER_SCROLL_STEP = 320;

type NexisFolderCarouselProps = {
  folders: TFolderWithSubfolders[];
  onMove: (folder: TFolderWithSubfolders) => void;
  onSettings: (folder: TFolderWithSubfolders) => void;
  onDelete: (folder: TFolderWithSubfolders) => void;
};

const NexisFolderCarousel = ({
  folders,
  onMove,
  onSettings,
  onDelete,
}: NexisFolderCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(maxScroll > 1 && scrollLeft < maxScroll - 1);
  }, []);

  useLayoutEffect(() => {
    syncScrollState();
  }, [folders.length, syncScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    syncScrollState();
    el.addEventListener('scroll', syncScrollState, { passive: true });
    const ro = new ResizeObserver(syncScrollState);
    ro.observe(el);

    return () => {
      el.removeEventListener('scroll', syncScrollState);
      ro.disconnect();
    };
  }, [syncScrollState]);

  const scrollByStep = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const chevronButtonClass = cn(
    'pointer-events-auto z-20 h-10 w-10 rounded-lg border-white/20 bg-[#1c1c1c]/95 text-white shadow-lg',
    'backdrop-blur-sm hover:bg-[#262626] hover:text-white',
  );

  return (
    <div className="relative w-full">
      {canScrollLeft ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Scroll folders left"
          className={cn(
            chevronButtonClass,
            'absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
          )}
          onClick={() => scrollByStep(-NEXIS_FOLDER_SCROLL_STEP)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      ) : null}

      {canScrollRight ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Scroll folders right"
          className={cn(
            chevronButtonClass,
            'absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2',
          )}
          onClick={() => scrollByStep(NEXIS_FOLDER_SCROLL_STEP)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      ) : null}

      <div
        ref={scrollRef}
        className="w-full min-w-0 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max max-w-none flex-nowrap gap-4 py-0.5">
          {folders.map((folder) => (
            <div key={folder.id} className="w-[280px] shrink-0 sm:w-[300px]">
              <FolderCard
                folder={folder}
                nexisChrome
                onMove={onMove}
                onSettings={onSettings}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const FolderGrid = ({ type, parentId, nexisChrome }: FolderGridProps) => {
  const team = useCurrentTeam();
  const organisation = useCurrentOrganisation();

  const [isMovingFolder, setIsMovingFolder] = useState(false);
  const [folderToMove, setFolderToMove] = useState<TFolderWithSubfolders | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<TFolderWithSubfolders | null>(null);
  const [isSettingsFolderOpen, setIsSettingsFolderOpen] = useState(false);
  const [folderToSettings, setFolderToSettings] = useState<TFolderWithSubfolders | null>(null);

  const { data: foldersData, isPending } = trpc.folder.getFolders.useQuery({
    type,
    parentId,
  });

  const formatBreadCrumbPath = (folderId: string) => {
    const rootPath =
      type === FolderType.DOCUMENT ? formatDocumentsPath(team.url) : formatTemplatesPath(team.url);

    return `${rootPath}/f/${folderId}`;
  };

  const formatViewAllFoldersPath = () => {
    const rootPath =
      type === FolderType.DOCUMENT ? formatDocumentsPath(team.url) : formatTemplatesPath(team.url);

    if (parentId) {
      return `${rootPath}/folders?parentId=${parentId}`;
    }

    return `${rootPath}/folders`;
  };

  const formatRootPath = () => {
    return type === FolderType.DOCUMENT
      ? formatDocumentsPath(team.url)
      : formatTemplatesPath(team.url);
  };

  const pinnedFolders = foldersData?.folders.filter((folder) => folder.pinned) || [];
  const unpinnedFolders = foldersData?.folders.filter((folder) => !folder.pinned) || [];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div
          className={cn(
            'flex flex-1 items-center text-sm font-medium',
            nexisChrome
              ? 'text-slate-400 [&_a:hover]:text-white [&_a]:text-slate-300'
              : 'text-muted-foreground hover:text-muted-foreground/80',
          )}
          data-testid="folder-grid-breadcrumbs"
        >
          <Link to={formatRootPath()} className="flex items-center">
            <HomeIcon className="mr-2 h-4 w-4" />
            <Trans>Home</Trans>
          </Link>

          {isPending && parentId ? (
            <div className="flex items-center">
              <Skeleton className="mx-3 h-4 w-1 rotate-12" />

              <Skeleton className="h-4 w-20" />
            </div>
          ) : (
            foldersData?.breadcrumbs.map((folder) => (
              <div key={folder.id} className="flex items-center">
                <span className="px-3">/</span>
                <Link to={formatBreadCrumbPath(folder.id)} className="flex items-center">
                  <FolderIcon className="mr-2 h-4 w-4" />
                  <span>{folder.name}</span>
                </Link>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap gap-3 sm:flex-row sm:justify-end">
          <EnvelopeUploadButton
            type={type}
            folderId={parentId || undefined}
            buttonClassName={nexisChrome ? nexisPrimaryButtonClassName : undefined}
          />

          {/* If you delete this, delete the component as well. */}
          {organisation.organisationClaim.flags.allowLegacyEnvelopes && (
            <DocumentUploadButtonLegacy nexisChrome={nexisChrome} type={type} />
          )}

          <FolderCreateDialog
            type={type}
            triggerButtonClassName={
              nexisChrome
                ? 'rounded-lg border border-[#495057] bg-transparent text-slate-200 hover:bg-white/5 hover:text-white'
                : undefined
            }
          />
        </div>
      </div>

      {isPending ? (
        nexisChrome ? (
          <div className="w-full">
            <div className="flex w-full gap-4 overflow-x-hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="w-[280px] shrink-0 rounded-lg border border-white/10 bg-[#121212] px-4 py-5 sm:w-[300px]"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex w-full items-center justify-between">
                      <div className="flex-1">
                        <Skeleton className="mb-2 h-4 w-24" />
                        <div className="flex space-x-2">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-3" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-2 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-full rounded-lg border border-border bg-card px-4 py-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="mb-2 h-4 w-24" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-2 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : foldersData && foldersData.folders.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <FolderCreateDialog
            type={type}
            trigger={
              <button type="button">
                <FolderCardEmpty nexisChrome={nexisChrome} type={type} />
              </button>
            }
          />
        </div>
      ) : (
        foldersData &&
        (nexisChrome ? (
          <NexisFolderCarousel
            folders={[...pinnedFolders, ...unpinnedFolders]}
            onMove={(folder) => {
              setFolderToMove(folder);
              setIsMovingFolder(true);
            }}
            onSettings={(folder) => {
              setFolderToSettings(folder);
              setIsSettingsFolderOpen(true);
            }}
            onDelete={(folder) => {
              setFolderToDelete(folder);
              setIsDeletingFolder(true);
            }}
          />
        ) : (
          <div key="content" className="space-y-4">
            {pinnedFolders.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {pinnedFolders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    nexisChrome={nexisChrome}
                    folder={folder}
                    onMove={(folder) => {
                      setFolderToMove(folder);
                      setIsMovingFolder(true);
                    }}
                    onSettings={(folder) => {
                      setFolderToSettings(folder);
                      setIsSettingsFolderOpen(true);
                    }}
                    onDelete={(folder) => {
                      setFolderToDelete(folder);
                      setIsDeletingFolder(true);
                    }}
                  />
                ))}
              </div>
            )}

            {unpinnedFolders.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {unpinnedFolders.slice(0, 12).map((folder) => (
                  <FolderCard
                    key={folder.id}
                    nexisChrome={nexisChrome}
                    folder={folder}
                    onMove={(folder) => {
                      setFolderToMove(folder);
                      setIsMovingFolder(true);
                    }}
                    onSettings={(folder) => {
                      setFolderToSettings(folder);
                      setIsSettingsFolderOpen(true);
                    }}
                    onDelete={(folder) => {
                      setFolderToDelete(folder);
                      setIsDeletingFolder(true);
                    }}
                  />
                ))}
              </div>
            )}

            {unpinnedFolders.length > 12 && (
              <div className="mt-2 flex items-center justify-center">
                <Link
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  to={formatViewAllFoldersPath()}
                >
                  <Trans>View all folders</Trans>
                </Link>
              </div>
            )}
          </div>
        ))
      )}

      <FolderMoveDialog
        foldersData={foldersData?.folders}
        folder={folderToMove}
        isOpen={isMovingFolder}
        onOpenChange={(open) => {
          setIsMovingFolder(open);

          if (!open) {
            setFolderToMove(null);
          }
        }}
      />

      <FolderUpdateDialog
        folder={folderToSettings}
        isOpen={isSettingsFolderOpen}
        onOpenChange={(open) => {
          setIsSettingsFolderOpen(open);

          if (!open) {
            setFolderToSettings(null);
          }
        }}
      />

      {folderToDelete && (
        <FolderDeleteDialog
          folder={folderToDelete}
          isOpen={isDeletingFolder}
          onOpenChange={(open) => {
            setIsDeletingFolder(open);

            if (!open) {
              setFolderToDelete(null);
            }
          }}
        />
      )}
    </div>
  );
};
