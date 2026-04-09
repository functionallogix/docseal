import { AlertCircle, CheckCircle2 } from 'lucide-react';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';
import { useToast } from './use-toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isDestructive = variant === 'destructive';

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex min-w-0 items-start gap-3">
              {isDestructive ? (
                <AlertCircle
                  className="mt-0.5 h-5 w-5 shrink-0 text-destructive dark:text-red-400"
                  aria-hidden
                />
              ) : (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              )}
              <div className="grid min-w-0 gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="truncate">{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
