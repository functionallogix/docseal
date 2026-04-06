import { useMemo, useTransition } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Loader } from 'lucide-react';
import { DateTime } from 'luxon';
import { Link } from 'react-router';
import { match } from 'ts-pattern';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { useSession } from '@documenso/lib/client-only/providers/session';
import { isDocumentCompleted } from '@documenso/lib/utils/document';
import { formatDocumentsPath } from '@documenso/lib/utils/teams';
import type { TFindDocumentsResponse } from '@documenso/trpc/server/document-router/find-documents.types';
import { cn } from '@documenso/ui/lib/utils';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import type { DataTableColumnDef, RowSelectionState } from '@documenso/ui/primitives/data-table';
import { DataTable } from '@documenso/ui/primitives/data-table';
import { DataTablePagination } from '@documenso/ui/primitives/data-table-pagination';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { TableCell } from '@documenso/ui/primitives/table';

import { DocumentStatus } from '~/components/general/document/document-status';
import { useCurrentTeam } from '~/providers/team';

import { StackAvatarsWithTooltip } from '../general/stack-avatars-with-tooltip';
import { DocumentsTableActionButton } from './documents-table-action-button';
import { DocumentsTableActionDropdown } from './documents-table-action-dropdown';

export type DocumentsTableProps = {
  data?: TFindDocumentsResponse;
  isLoading?: boolean;
  isLoadingError?: boolean;
  onMoveDocument?: (documentId: number) => void;
  enableSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  variant?: 'default' | 'nexis';
};

type DocumentsTableRow = TFindDocumentsResponse['data'][number];

export const DocumentsTable = ({
  data,
  isLoading,
  isLoadingError,
  onMoveDocument,
  enableSelection,
  rowSelection,
  onRowSelectionChange,
  variant = 'default',
}: DocumentsTableProps) => {
  const { _, i18n } = useLingui();

  const team = useCurrentTeam();
  const [isPending, startTransition] = useTransition();

  const updateSearchParams = useUpdateSearchParams();

  const columns = useMemo(() => {
    const cols: DataTableColumnDef<DocumentsTableRow>[] = [];

    if (enableSelection) {
      cols.push({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={_(msg`Select all`)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={_(msg`Select row`)}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      });
    }

    cols.push(
      {
        header: _(msg`Created`),
        accessorKey: 'createdAt',
        cell: ({ row }) =>
          i18n.date(row.original.createdAt, { ...DateTime.DATETIME_SHORT, hourCycle: 'h12' }),
      },
      {
        header: _(msg`Title`),
        cell: ({ row }) => (
          <DataTableTitle
            row={row.original}
            teamUrl={team?.url}
            linkClassName={
              variant === 'nexis'
                ? 'text-[#48EAE5] hover:text-[#5eead4] hover:underline'
                : undefined
            }
          />
        ),
      },
      {
        id: 'sender',
        header: _(msg`Sender`),
        cell: ({ row }) => row.original.user.name ?? row.original.user.email,
      },
      {
        header: _(msg`Recipient`),
        accessorKey: 'recipient',
        cell: ({ row }) => (
          <StackAvatarsWithTooltip
            recipients={row.original.recipients}
            documentStatus={row.original.status}
          />
        ),
      },
      {
        header: _(msg`Status`),
        accessorKey: 'status',
        cell: ({ row }) => <DocumentStatus status={row.original.status} />,
        size: 140,
      },
      {
        header: _(msg`Actions`),
        cell: ({ row }) =>
          (!row.original.deletedAt || isDocumentCompleted(row.original.status)) && (
            <div className="flex items-center gap-x-4">
              <DocumentsTableActionButton row={row.original} variant={variant} />
              <DocumentsTableActionDropdown
                row={row.original}
                variant={variant}
                onMoveDocument={onMoveDocument ? () => onMoveDocument(row.original.id) : undefined}
              />
            </div>
          ),
      },
    );

    return cols;
  }, [team, onMoveDocument, enableSelection, variant, _, i18n]);

  const onPaginationChange = (page: number, perPage: number) => {
    startTransition(() => {
      updateSearchParams({
        page,
        perPage,
      });
    });
  };

  const results = data ?? {
    data: [],
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  };

  const nexisTableWrap =
    variant === 'nexis'
      ? 'rounded-xl border border-white/10 bg-[#050505] [&_thead]:bg-[#0a0a0a] [&_th]:text-[10px] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-slate-500 [&_tbody_tr:nth-child(even)]:bg-white/[0.03] [&_tbody_tr]:border-white/[0.06]'
      : undefined;

  return (
    <div className="relative">
      <DataTable
        columns={columns}
        data={results.data}
        tableContainerClassName={nexisTableWrap}
        perPage={results.perPage}
        currentPage={results.currentPage}
        totalPages={results.totalPages}
        onPaginationChange={onPaginationChange}
        columnVisibility={{
          sender: team !== undefined,
        }}
        error={{
          enable: isLoadingError || false,
        }}
        skeleton={{
          enable: isLoading || false,
          rows: 5,
          component: (
            <>
              {enableSelection && (
                <TableCell>
                  <Skeleton className="h-4 w-4 rounded" />
                </TableCell>
              )}
              <TableCell>
                <Skeleton className="h-4 w-40 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20 rounded-full" />
              </TableCell>
              <TableCell className="py-4">
                <div className="flex w-full flex-row items-center">
                  <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-10 w-24 rounded" />
              </TableCell>
            </>
          ),
        }}
        enableRowSelection={enableSelection}
        rowSelection={rowSelection}
        onRowSelectionChange={onRowSelectionChange}
        getRowId={(row) => row.envelopeId}
      >
        {(table) => <DataTablePagination additionalInformation="VisibleCount" table={table} />}
      </DataTable>

      {isPending && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            variant === 'nexis' ? 'bg-black/50' : 'bg-background/50',
          )}
        >
          <Loader
            className={cn(
              'h-8 w-8 animate-spin',
              variant === 'nexis' ? 'text-[#48EAE5]' : 'text-muted-foreground',
            )}
          />
        </div>
      )}
    </div>
  );
};

type DataTableTitleProps = {
  row: DocumentsTableRow;
  teamUrl: string;
  linkClassName?: string;
};

const DataTableTitle = ({ row, teamUrl, linkClassName }: DataTableTitleProps) => {
  const { user } = useSession();

  const recipient = row.recipients.find((recipient) => recipient.email === user.email);

  const isOwner = row.user.id === user.id;
  const isRecipient = !!recipient;
  const isCurrentTeamDocument = teamUrl && row.team?.url === teamUrl;

  const documentsPath = formatDocumentsPath(teamUrl);
  const formatPath = `${documentsPath}/${row.envelopeId}`;

  return match({
    isOwner,
    isRecipient,
    isCurrentTeamDocument,
  })
    .with({ isOwner: true }, { isCurrentTeamDocument: true }, () => (
      <Link
        to={formatPath}
        title={row.title}
        className={cn(
          'block max-w-[10rem] truncate font-medium hover:underline md:max-w-[20rem]',
          linkClassName,
        )}
      >
        {row.title}
      </Link>
    ))
    .with({ isRecipient: true }, () => (
      <Link
        to={`/sign/${recipient?.token}`}
        title={row.title}
        className={cn(
          'block max-w-[10rem] truncate font-medium hover:underline md:max-w-[20rem]',
          linkClassName,
        )}
      >
        {row.title}
      </Link>
    ))
    .otherwise(() => (
      <span className="block max-w-[10rem] truncate font-medium hover:underline md:max-w-[20rem]">
        {row.title}
      </span>
    ));
};
