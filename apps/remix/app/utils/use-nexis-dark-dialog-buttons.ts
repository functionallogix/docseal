import { Theme, useTheme } from 'remix-themes';

import {
  nexisDestructiveDialogButtonClassName,
  nexisDialogCancelButtonClassName,
  nexisPrimaryButtonClassName,
} from './nexis-ui';

/**
 * Nexis dialog button chrome when the app theme is dark (documents dashboard, modals on #212529).
 */
export function useNexisDarkDialogButtons() {
  const [theme] = useTheme();
  const active = theme === Theme.DARK;

  return {
    active,
    cancelVariant: (active ? 'none' : 'secondary') as 'none' | 'secondary',
    cancelClassName: active ? nexisDialogCancelButtonClassName : undefined,
    primaryVariant: (active ? 'none' : 'default') as 'none' | 'default',
    primaryClassName: active ? nexisPrimaryButtonClassName : undefined,
    destructiveVariant: (active ? 'none' : 'destructive') as 'none' | 'destructive',
    destructiveClassName: active ? nexisDestructiveDialogButtonClassName : undefined,
  };
}
