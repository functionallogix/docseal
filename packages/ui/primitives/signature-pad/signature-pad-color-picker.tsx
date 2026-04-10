import { Trans } from '@lingui/react/macro';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';

import { cn } from '../../lib/utils';

export type SignaturePadColorPickerProps = {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  className?: string;
  /** Dark canvas variant: white label, swatch + name + chevron like the Nexis sign dialog. */
  appearance?: 'default' | 'nexis';
};

const colorLabel = (key: string) => {
  switch (key) {
    case 'white':
      return <Trans>White</Trans>;
    case 'black':
      return <Trans>Black</Trans>;
    case 'red':
      return <Trans>Red</Trans>;
    case 'blue':
      return <Trans>Blue</Trans>;
    case 'green':
      return <Trans>Green</Trans>;
    default:
      return key;
  }
};

const colorSwatch = (key: string) => {
  const map: Record<string, string> = {
    white: 'bg-white border border-white/30',
    black: 'bg-black border-border',
    red: 'bg-[red] border-border',
    blue: 'bg-[blue] border-border',
    green: 'bg-[green] border-border',
  };
  return map[key] ?? 'bg-neutral-500 border-border';
};

export const SignaturePadColorPicker = ({
  selectedColor,
  setSelectedColor,
  className,
  appearance = 'default',
}: SignaturePadColorPickerProps) => {
  const isNexis = appearance === 'nexis';

  return (
    <div
      className={cn(
        'absolute right-2 top-2 filter',
        isNexis ? 'text-white' : 'text-foreground',
        className,
      )}
    >
      <Select value={selectedColor} onValueChange={(value) => setSelectedColor(value)}>
        <SelectTrigger
          className={cn(
            'h-auto w-auto border-none p-0.5',
            isNexis &&
              'gap-1.5 text-sm text-white hover:bg-transparent focus:ring-0 focus:ring-offset-0',
          )}
        >
          {isNexis ? (
            <>
              <span className="sr-only">
                <SelectValue />
              </span>
              <span className="flex items-center gap-2" aria-hidden>
                <span
                  className={cn(
                    'h-4 w-4 shrink-0 rounded-full border-2 shadow-sm',
                    colorSwatch(selectedColor),
                  )}
                />
                <span className="font-medium">{colorLabel(selectedColor)}</span>
              </span>
            </>
          ) : (
            <SelectValue placeholder="" />
          )}
        </SelectTrigger>

        <SelectContent
          className={cn(isNexis && 'border-white/10 bg-[#141618] text-white')}
          align="end"
        >
          {(isNexis
            ? (['white', 'black', 'red', 'blue', 'green'] as const)
            : (['black', 'red', 'blue', 'green'] as const)
          ).map((key) => (
            <SelectItem key={key} value={key}>
              <div
                className={cn(
                  'flex items-center text-[0.688rem]',
                  isNexis ? 'text-white/90' : 'text-muted-foreground',
                )}
              >
                <div
                  className={cn(
                    'mr-2 h-4 w-4 shrink-0 rounded-full border-2 shadow-sm',
                    colorSwatch(key),
                  )}
                />
                {colorLabel(key)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
