import * as React from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '../lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    checkClassName?: string;
  }
>(({ className, checkClassName, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'group peer h-4 w-4 shrink-0 rounded-sm border border-input bg-background ring-offset-background',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
      /* Dark UI (MOS Nexis): checked state uses brand cyan, not theme primary (lime). */
      'dark:data-[state=checked]:border-[#48EAE5] dark:data-[state=checked]:bg-[#48EAE5]',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        'flex items-center justify-center text-primary-foreground dark:group-data-[state=checked]:text-[#0B0C0E]',
        checkClassName,
      )}
    >
      <Check className="h-3 w-3 stroke-[3px]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
