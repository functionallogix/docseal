import { cn } from '@documenso/ui/lib/utils';

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
