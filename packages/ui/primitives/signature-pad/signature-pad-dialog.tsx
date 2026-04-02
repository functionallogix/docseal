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
          overlayClassName="bg-black/75 backdrop-blur-[2px]"
          className={cn(
            'nexis-signature-dialog relative w-[min(880px,calc(100vw-1.5rem))] gap-4 overflow-hidden rounded-[22px] border border-white/10 bg-[#06110f]/70 p-5 shadow-[0_40px_160px_rgba(0,0,0,0.8)] backdrop-blur-xl',
            'sm:rounded-[26px] sm:p-6',
            // Tabs look
            '[&_[role=tabslist]]:gap-2 [&_[role=tabslist]]:border-white/10',
            '[&_[role=tab]]:px-3 [&_[role=tab]]:py-3 [&_[role=tab]]:text-white/55',
            '[&_[role=tab][data-state=active]]:text-white',
            '[&_[role=tab]_.bg-foreground\\/40]:bg-[#48EAE5]/60',
            // Signature panel look (transparent so dialog bg continues)
            '[&_.aspect-signature-pad]:rounded-[18px] [&_.aspect-signature-pad]:border [&_.aspect-signature-pad]:border-white/10',
            '[&_.aspect-signature-pad]:bg-transparent [&_.aspect-signature-pad]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]',
            '[&_.aspect-signature-pad]:backdrop-blur-0',
            '[&_[role=tabpanel]]:!bg-transparent dark:[&_[role=tabpanel]]:!bg-transparent',
          )}
        >
          <img
            src="/static/signature-dialog-glow.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[520px] select-none opacity-90"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.03] via-transparent to-black/20" />

          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>

          <SignaturePad
            id="signature"
            fullName={fullName}
            value={value}
            className={className}
            disabled={disabled}
            onChange={({ value }) => setSignature(value)}
            typedSignatureEnabled={typedSignatureEnabled}
            uploadSignatureEnabled={uploadSignatureEnabled}
            drawSignatureEnabled={drawSignatureEnabled}
          />

          <DialogFooter className="mt-1 gap-3 sm:flex-col sm:items-stretch sm:justify-start sm:space-x-0">
            <Button
              type="button"
              size="lg"
              disabled={!signature}
              className="h-11 w-full rounded-[14px] border border-[#48EAE5] bg-[#48EAE5] px-6 font-semibold text-[#0B0C0E] shadow-[0_10px_40px_rgba(72,234,229,0.15)] hover:bg-[#38d4cf]"
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
                className="h-10 w-full text-center text-sm text-cyan-300/90 transition hover:text-cyan-200"
              >
                <Trans>Cancel</Trans>
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
