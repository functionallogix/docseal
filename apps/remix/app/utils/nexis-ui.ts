import { cn } from '@documenso/ui/lib/utils';

/** Remix `public/static` assets for Nexis envelope editor row actions. */
export const nexisEnvelopeActionIconSrc = {
  pencil: '/static/PencilSimple.svg',
  trash: '/static/TrashSimple.svg',
  close: '/static/X.svg',
} as const;

/** Primary CTA: bg cyan, border Grey-600 (MOS Nexis spec). `!` so it wins over default `Button` variant. */
export const nexisPrimaryButtonClassName =
  'rounded-lg !border-[#495057] !bg-[#48EAE5] font-semibold !text-[#0B0C0E] shadow-none hover:!bg-[#3dd8d3] hover:!text-[#0B0C0E]';

/** Table Edit / Sign / Download & upload row — cyan text + icon (no filled button). */
export const nexisTextActionClassName = cn(
  'inline-flex h-auto min-h-0 items-center gap-2 rounded-none border-0 bg-transparent !bg-transparent p-0 text-sm font-medium text-[#48EAE5] shadow-none',
  'hover:bg-transparent hover:!bg-transparent hover:text-[#5eead4] hover:underline',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#48EAE5] focus-visible:ring-offset-0',
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline',
);

/** @deprecated Prefer nexisTextActionClassName for dashboard actions. */
export const nexisTableActionButtonClassName = nexisPrimaryButtonClassName;

/** ⋮ dropdown panels on dark dashboard — bg pure black, grey border. */
export const nexisDropdownMenuContentClassName = cn(
  'border border-[#495057] bg-black text-white shadow-lg',
  '[&_[role=menuitem]]:text-white',
  '[&_[role=menuitem]:focus]:bg-white/10 [&_[role=menuitem]:focus]:text-white',
  '[&_[role=menuitem][data-highlighted]]:!bg-white/10 [&_[role=menuitem][data-highlighted]]:!text-white',
  '[&_[role=separator]]:bg-white/15',
);

export const nexisDropdownMenuLabelClassName = 'text-slate-500';

/** Email / name fields on envelope recipient rows — matches Documents card inputs. */
export const nexisEnvelopeRecipientInputClassName = cn(
  'rounded-md border border-white/15 bg-[#141414] text-white shadow-none',
  'placeholder:text-slate-500',
  'focus-visible:border-[#48EAE5]/40 focus-visible:ring-1 focus-visible:ring-[#48EAE5] focus-visible:ring-offset-0',
);

/** Suggestion list under recipient autocomplete (Popover + cmdk). */
export const nexisRecipientAutocompletePopoverClassName = cn(
  'z-[1100] border border-[#495057] bg-black p-0 text-slate-200 shadow-lg',
  '[&_[cmdk-group]]:border-white/10',
  '[&_[cmdk-item]]:text-slate-200',
  '[&_[cmdk-item][data-selected=true]]:bg-white/10 [&_[cmdk-item][data-selected=true]]:text-white',
  '[&_[cmdk-item][aria-selected=true]]:bg-white/10 [&_[cmdk-item][aria-selected=true]]:text-white',
);

/** Radix Select panel for recipient role (envelope editor). */
export const nexisRecipientRoleSelectContentClassName = cn(
  'z-[1100] border border-[#495057] bg-black text-white shadow-lg',
  '[&_[data-radix-select-viewport]]:!min-w-[280px] [&_[data-radix-select-viewport]]:!h-auto [&_[data-radix-select-viewport]]:max-h-[min(20rem,60vh)]',
);

export const nexisRecipientRoleSelectItemClassName = cn(
  'rounded-sm text-white',
  'focus:bg-white/10 focus:text-white',
  'data-[highlighted]:bg-white/10 data-[highlighted]:text-white',
  '[&_svg]:text-white',
  '[&_span_.lucide-check]:text-[#48EAE5]',
  '[&_.lucide-info]:text-slate-400 [&_.lucide-info]:hover:text-slate-200',
);

/** Tooltips inside role dropdown (info icons). */
export const nexisRecipientRoleTooltipContentClassName = cn(
  'z-[1200] max-w-md border border-[#495057] bg-black p-4 text-slate-200 shadow-lg',
  '[&_p]:text-slate-200',
);

/** Radix checkbox — checked fill matches primary CTA cyan; checkmark dark for contrast. */
export const nexisCheckboxClassName = cn(
  'rounded-md border border-white/20 bg-[#141414] ring-offset-0',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#48EAE5] focus-visible:ring-offset-0',
  'data-[state=checked]:border-[#48EAE5] data-[state=checked]:!bg-[#48EAE5]',
);

export const nexisCheckboxCheckClassName = '!text-[#0B0C0E]';

/** Compact dialog (e.g. Send Document) — shell + form field chrome. */
export const nexisDistributeDialogContentClassName = cn(
  /* Panel fill from global `bg-dialog-panel` (#212529 / MN Grey 900 in dark). */
  'border border-white/10 text-slate-200',
  '[&_[data-radix-dialog-close]]:text-slate-400',
);

export const nexisDistributeDialogFieldShellClassName = cn(
  '[&_label]:text-slate-400 [&_input]:border-white/15 [&_input]:bg-[#141414] [&_input]:text-white',
  '[&_input]:placeholder:text-slate-500 [&_input]:focus-visible:border-[#48EAE5]/40 [&_input]:focus-visible:ring-1 [&_input]:focus-visible:ring-[#48EAE5]',
  '[&_textarea]:border-white/15 [&_textarea]:bg-[#141414] [&_textarea]:text-white [&_textarea]:placeholder:text-slate-500',
  '[&_textarea]:focus-visible:border-[#48EAE5]/40 [&_textarea]:focus-visible:ring-1 [&_textarea]:focus-visible:ring-[#48EAE5]',
  '[&_button[role=combobox]]:border-white/15 [&_button[role=combobox]]:!bg-[#141414] [&_button[role=combobox]]:!text-white',
);

export const nexisDialogCancelButtonClassName = cn(
  'border-white/15 bg-black/40 text-[#48EAE5] shadow-none hover:bg-white/10 hover:text-[#5eead4]',
);

/** Tabs like Email | None — dark track, cyan active pill. */
export const nexisDistributeDialogTabsClassName = cn(
  'bg-white/5 p-1',
  '[&_button]:text-slate-400 [&_button:hover]:text-slate-200',
  '[&_button[data-state=active]]:!bg-[#48EAE5] [&_button[data-state=active]]:!text-[#0B0C0E]',
);

/** Team document view (`/t/.../documents/:id`) — matches editor chrome. */
export const nexisTeamDocumentPageShellClassName = 'bg-black pb-16 text-slate-200';

export const nexisTeamDocumentBackLinkClassName =
  'text-[#48EAE5] hover:text-[#5eead4] hover:opacity-100';

export const nexisTeamDocumentViewerCardClassName = cn(
  'rounded-xl border border-[#48EAE5]/25 bg-black/60 shadow-none',
);

export const nexisTeamDocumentHeroSectionClassName = cn(
  'border-white/10 bg-black',
  '[&_h3]:text-white [&_.border-t]:border-white/10',
);

/** Information / Recipients / Recent activity cards on document view. */
export const nexisTeamDocumentSidebarCardClassName = cn(
  '!border-white/10 !bg-black text-slate-200',
  '[&_h1]:text-white [&_ul]:border-white/10 [&_.divide-y]:border-white/10',
);

/** Preview step banner — replaces warning/amber strip with Nexis cyan. */
export const nexisPreviewModeAlertClassName = cn(
  '!border-[#48EAE5]/35 !bg-[#48EAE5]/12 text-slate-200',
  '[&_.alert-title]:!text-white',
  '[&_.alert-description]:!text-slate-300',
  '[&>svg]:!text-[#48EAE5]',
);

/** Selected Recipient combobox — matches dark inputs; cyan focus (no recipient green ring). */
export const nexisEnvelopeRecipientSelectorTriggerClassName = cn(
  '!inline-flex h-auto min-h-10 w-full items-center rounded-md !border border-white/15 !bg-[#141414] px-3 py-2 text-sm font-normal !text-white shadow-none',
  'hover:!border-white/15 hover:!bg-[#141414] hover:!text-white',
  'focus-visible:!border-[#48EAE5]/40 focus-visible:outline-none focus-visible:!ring-2 focus-visible:!ring-[#48EAE5] focus-visible:!ring-offset-0',
);

/** Recipient selector popover (cmdk). */
export const nexisEnvelopeRecipientSelectorPopoverClassName = cn(
  'z-[1100] w-[var(--radix-popover-trigger-width)] border border-[#495057] bg-black p-0 text-slate-200 shadow-lg',
  '[&_[cmdk-input-wrapper]]:border-white/10 [&_[cmdk-input]]:border-0 [&_[cmdk-input]]:bg-[#141414] [&_[cmdk-input]]:text-white [&_[cmdk-input]]:placeholder:text-slate-500',
  '[&_[cmdk-item]]:text-slate-200',
  '[&_[cmdk-item][data-selected=true]]:bg-white/10 [&_[cmdk-item][data-selected=true]]:text-white',
  '[&_[cmdk-item][aria-selected=true]]:bg-white/10 [&_[cmdk-item][aria-selected=true]]:text-white',
  '[&_[cmdk-empty]]:text-slate-500',
);

export const nexisEnvelopeRecipientSelectorItemClassName = cn(
  'text-slate-200',
  'data-[selected=true]:bg-white/10 data-[selected=true]:text-white',
);
