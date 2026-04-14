import { Plural } from '@lingui/react/macro';

import { useCurrentEnvelopeRender } from '@documenso/lib/client-only/providers/envelope-render-provider';
import { cn } from '@documenso/ui/lib/utils';

import { useEnvelopeEditorNexisChrome } from './envelope-editor-nexis-chrome-context';

type EnvelopeItemSelectorProps = {
  number: number;
  primaryText: React.ReactNode;
  secondaryText: React.ReactNode;
  isSelected: boolean;
  buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  actionSlot?: React.ReactNode;
  nexisChrome?: boolean;
};

export const EnvelopeItemSelector = ({
  number,
  primaryText,
  secondaryText,
  isSelected,
  buttonProps,
  actionSlot,
  nexisChrome = false,
}: EnvelopeItemSelectorProps) => {
  return (
    <button
      title={typeof primaryText === 'string' ? primaryText : undefined}
      className={cn(
        /* Fixed width so Add Fields (edit action slot) and Preview (status dot) stay aligned. */
        'group flex h-fit w-72 min-w-72 max-w-72 shrink-0 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
        nexisChrome
          ? isSelected
            ? 'border-0 bg-[#48EAE5]/10 text-slate-100 shadow-[0_0_20px_-10px_rgba(72,234,229,0.45)] ring-1 ring-[#48EAE5]/45'
            : 'border-0 bg-white/[0.04] hover:bg-white/[0.07]'
          : isSelected
            ? 'border-green-200 bg-green-50 text-green-900 dark:border-green-400/30 dark:bg-green-400/10 dark:text-green-400'
            : 'border-border bg-muted/50 hover:bg-muted/70',
      )}
      {...buttonProps}
    >
      <div
        className={cn(
          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium',
          nexisChrome
            ? isSelected
              ? 'bg-[#48EAE5] text-[#0B0C0E]'
              : 'bg-white/10 text-slate-400'
            : isSelected
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-200 text-gray-600',
        )}
      >
        {number}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-medium">{primaryText}</div>
        <div className={cn('text-xs', nexisChrome ? 'text-slate-500' : 'text-gray-500')}>
          {secondaryText}
        </div>
      </div>
      {/* Same 20×20 slot everywhere so the status dot lines up (Preview vs Add Fields edit control). */}
      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        {actionSlot ?? (
          <div
            className={cn('h-2 w-2 shrink-0 rounded-full', {
              'bg-[#48EAE5]': isSelected && nexisChrome,
              'bg-green-500': isSelected && !nexisChrome,
            })}
          />
        )}
      </div>
    </button>
  );
};

type EnvelopeRendererFileSelectorProps = {
  fields: { envelopeItemId: string }[];
  className?: string;
  secondaryOverride?: React.ReactNode;
  renderItemAction?: (item: { id: string; title: string }) => React.ReactNode;
};

export const EnvelopeRendererFileSelector = ({
  fields,
  className,
  secondaryOverride,
  renderItemAction,
}: EnvelopeRendererFileSelectorProps) => {
  const nexisChrome = useEnvelopeEditorNexisChrome();
  const { envelopeItems, currentEnvelopeItem, setCurrentEnvelopeItem } = useCurrentEnvelopeRender();

  return (
    <div
      className={cn(
        'scrollbar-hidden flex h-fit flex-shrink-0 space-x-2 overflow-x-auto p-4',
        className,
      )}
    >
      {envelopeItems.map((doc, i) => (
        <EnvelopeItemSelector
          key={doc.id}
          number={i + 1}
          primaryText={doc.title}
          secondaryText={
            secondaryOverride ?? (
              <Plural
                one="1 Field"
                other="# Fields"
                value={fields.filter((field) => field.envelopeItemId === doc.id).length}
              />
            )
          }
          isSelected={currentEnvelopeItem?.id === doc.id}
          buttonProps={{
            onClick: () => setCurrentEnvelopeItem(doc.id),
          }}
          actionSlot={renderItemAction?.(doc)}
          nexisChrome={nexisChrome}
        />
      ))}
    </div>
  );
};
