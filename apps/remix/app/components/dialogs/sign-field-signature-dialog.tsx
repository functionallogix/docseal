import { useState } from 'react';

import { Trans } from '@lingui/react/macro';
import { X } from 'lucide-react';
import { createCallable } from 'react-call';

import { Button } from '@documenso/ui/primitives/button';
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@documenso/ui/primitives/dialog';
import { SignaturePad } from '@documenso/ui/primitives/signature-pad';
import {
  SIGNATURE_NEXIS_DIALOG_CONTENT_CLASS,
  SIGNATURE_NEXIS_DIALOG_OVERLAY_CLASS,
} from '@documenso/ui/primitives/signature-pad/signature-pad-dialog';

import { DocumentSigningDisclosure } from '../general/document-signing/document-signing-disclosure';

export type SignFieldSignatureDialogProps = {
  initialSignature?: string;
  fullName?: string;
  typedSignatureEnabled?: boolean;
  uploadSignatureEnabled?: boolean;
  drawSignatureEnabled?: boolean;
};

export const SignFieldSignatureDialog = createCallable<
  SignFieldSignatureDialogProps,
  string | null
>(
  ({
    call,
    fullName,
    typedSignatureEnabled,
    uploadSignatureEnabled,
    drawSignatureEnabled,
    initialSignature,
  }) => {
    const [localSignature, setLocalSignature] = useState(initialSignature);

    return (
      <Dialog open={true} onOpenChange={(value) => (!value ? call.end(null) : null)}>
        <DialogContent
          position="center"
          hideClose
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
              fullName={fullName}
              value={localSignature ?? ''}
              appearance="nexis"
              onChange={({ value }) => setLocalSignature(value)}
              typedSignatureEnabled={typedSignatureEnabled}
              uploadSignatureEnabled={uploadSignatureEnabled}
              drawSignatureEnabled={drawSignatureEnabled}
            />

            <DocumentSigningDisclosure className="text-[#8E8E8E]/95 [&_a]:text-[#48EAE5] [&_a]:hover:text-[#7ef4ee]" />

            <DialogFooter className="mt-0 gap-3 sm:flex-col sm:items-stretch sm:justify-start sm:space-x-0">
              <Button
                type="button"
                size="lg"
                disabled={!localSignature}
                className="h-11 w-full rounded-lg border border-[#48EAE5] bg-[#48EAE5] px-6 font-semibold text-[#0B0C0E] shadow-[0_10px_36px_rgba(72,234,229,0.22)] hover:bg-[#3bd8d2]"
                onClick={() => call.end(localSignature || null)}
              >
                <Trans>Sign</Trans>
              </Button>

              <button
                type="button"
                className="h-10 w-full text-center text-sm font-medium text-[#48EAE5] transition hover:text-[#7ef4ee]"
                onClick={() => call.end(null)}
              >
                <Trans>Cancel</Trans>
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);
