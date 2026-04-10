import type { HTMLAttributes } from 'react';
import { useState } from 'react';

import type { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import { Dialog, DialogClose, DialogContent, DialogFooter } from '@documenso/ui/primitives/dialog';

import { cn } from '../../lib/utils';
import { Button } from '../button';
import { SignaturePad } from './signature-pad';
import { SignatureRender } from './signature-render';

/** Shared shell for Nexis-style sign modals (draw / type / upload + cyan actions). */
export const SIGNATURE_NEXIS_DIALOG_OVERLAY_CLASS = 'bg-[#000000CC]';

/** Cyan wash: see `theme.css` `.nexis-signature-dialog` (reliable vs `bg-dialog-panel` / merge). */
/** `flex flex-col` overrides default DialogContent `grid` so glow/close don’t create stray rows. */
export const SIGNATURE_NEXIS_DIALOG_CONTENT_CLASS = cn(
  'nexis-signature-dialog relative flex w-[min(880px,calc(100vw-1.5rem))] max-w-none flex-col gap-3 overflow-hidden rounded-[14px] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.65)] sm:p-6',
);

export type SignaturePadDialogProps = Omit<HTMLAttributes<HTMLCanvasElement>, 'onChange'> & {
  disabled?: boolean;
  fullName?: string;
  value?: string;
  onChange: (_value: string) => void;
  dialogConfirmText?: MessageDescriptor | string;
  disableAnimation?: boolean;
  typedSignatureEnabled?: boolean;
  uploadSignatureEnabled?: boolean;
  drawSignatureEnabled?: boolean;
};

export const SignaturePadDialog = ({
  className,
  fullName,
  value,
  onChange,
  disabled = false,
  disableAnimation = false,
  typedSignatureEnabled,
  uploadSignatureEnabled,
  drawSignatureEnabled,
  dialogConfirmText,
}: SignaturePadDialogProps) => {
  const { i18n } = useLingui();

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signature, setSignature] = useState<string>(value ?? '');

  const confirmLabel =
    dialogConfirmText &&
    (typeof dialogConfirmText === 'string'
      ? dialogConfirmText
      : // `i18n._` may be unavailable if no Lingui provider is mounted (e.g. SSR edge-cases).
        ((i18n as unknown as { _: undefined | ((d: MessageDescriptor) => string) })?._?.(
          dialogConfirmText,
        ) ?? dialogConfirmText.id));

  return (
    <div
      className={cn(
        'relative block aspect-signature-pad w-full select-none rounded-lg border bg-background',
        className,
        {
          'pointer-events-none opacity-50': disabled,
        },
      )}
    >
      {value && (
        <div className="inset-0 h-full w-full">
          <SignatureRender value={value} />
        </div>
      )}

      <motion.button
        data-testid="signature-pad-dialog-button"
        type="button"
        disabled={disabled}
        className="absolute inset-0 flex items-center justify-center bg-transparent"
        onClick={() => setShowSignatureModal(true)}
        whileHover="onHover"
      >
        {!value && !disableAnimation && (
          <motion.svg
            width="120"
            height="120"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-muted-foreground/60"
            variants={{
              onHover: {
                scale: 1.1,
                transition: {
                  type: 'spring',
                  stiffness: 300,
                  damping: 12,
                  mass: 0.8,
                  restDelta: 0.001,
                },
              },
            }}
          >
            <motion.path
              d="M1.5 11H14.5M1.5 14C1.5 14 8.72 2 4.86938 2H4.875C2.01 2 1.97437 14.0694 8 6.51188V6.5C8 6.5 9 11.3631 11.5 7.52375V7.5C11.5 7.5 11.5 9 14.5 9"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: 1,
                transition: {
                  pathLength: {
                    duration: 2,
                    ease: 'easeInOut',
                  },
                  opacity: { duration: 0.6 },
                },
              }}
            />
          </motion.svg>
        )}
      </motion.button>

      <Dialog open={showSignatureModal} onOpenChange={disabled ? undefined : setShowSignatureModal}>
        <DialogContent
          position="center"
          hideClose={true}
          overlayClassName={SIGNATURE_NEXIS_DIALOG_OVERLAY_CLASS}
          className={SIGNATURE_NEXIS_DIALOG_CONTENT_CLASS}
        >
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-3 top-3 z-[2] inline-flex h-9 w-9 items-center justify-center rounded-md text-white opacity-90 transition hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#48EAE5]/35 sm:right-4 sm:top-4"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </DialogClose>

          <div className="relative z-[1] flex min-h-0 w-full min-w-0 flex-col gap-3">
            <SignaturePad
              id="signature"
              fullName={fullName}
              value={value}
              className={className}
              disabled={disabled}
              appearance="nexis"
              onChange={({ value }) => setSignature(value)}
              typedSignatureEnabled={typedSignatureEnabled}
              uploadSignatureEnabled={uploadSignatureEnabled}
              drawSignatureEnabled={drawSignatureEnabled}
            />

            <DialogFooter className="mt-0 gap-3 sm:flex-col sm:items-stretch sm:justify-start sm:space-x-0">
              <Button
                type="button"
                size="lg"
                disabled={!signature}
                className="h-11 w-full rounded-lg border border-[#48EAE5] bg-[#48EAE5] px-6 font-semibold text-[#0B0C0E] shadow-[0_10px_36px_rgba(72,234,229,0.22)] hover:bg-[#3bd8d2]"
                onClick={() => {
                  onChange(signature);
                  setShowSignatureModal(false);
                }}
              >
                {confirmLabel ?? <Trans>Next</Trans>}
              </Button>

              <DialogClose asChild>
                <button
                  type="button"
                  className="h-10 w-full text-center text-sm font-medium text-[#48EAE5] transition hover:text-[#7ef4ee]"
                >
                  <Trans>Cancel</Trans>
                </button>
              </DialogClose>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
