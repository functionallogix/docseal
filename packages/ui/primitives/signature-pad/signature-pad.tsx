import type { HTMLAttributes } from 'react';
import { useState } from 'react';

import { Trans } from '@lingui/react/macro';
import { KeyboardIcon, UploadCloudIcon } from 'lucide-react';
import { match } from 'ts-pattern';

import { DocumentSignatureType } from '@documenso/lib/constants/document';
import { isBase64Image } from '@documenso/lib/constants/signatures';

import { SignatureIcon } from '../../icons/signature';
import { cn } from '../../lib/utils';
import { SignaturePadDraw } from './signature-pad-draw';
import { SignaturePadType } from './signature-pad-type';
import { SignaturePadUpload } from './signature-pad-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './signature-tabs';

export type SignaturePadValue = {
  type: DocumentSignatureType;
  value: string;
};

export type SignaturePadProps = Omit<HTMLAttributes<HTMLCanvasElement>, 'onChange'> & {
  fullName?: string;
  value?: string;
  onChange?: (_value: SignaturePadValue) => void;

  disabled?: boolean;

  typedSignatureEnabled?: boolean;
  uploadSignatureEnabled?: boolean;
  drawSignatureEnabled?: boolean;

  onValidityChange?: (isValid: boolean) => void;

  /** Nexis sign dialog: text-only tabs; drawing area uses modal bg (transparent panel + border). */
  appearance?: 'default' | 'nexis';
};

export const SignaturePad = ({
  fullName,
  value = '',
  onChange,
  disabled = false,
  typedSignatureEnabled = true,
  uploadSignatureEnabled = true,
  drawSignatureEnabled = true,
  appearance = 'default',
}: SignaturePadProps) => {
  const [imageSignature, setImageSignature] = useState(isBase64Image(value) ? value : '');
  const [drawSignature, setDrawSignature] = useState(isBase64Image(value) ? value : '');
  const [typedSignature, setTypedSignature] = useState(isBase64Image(value) ? '' : value);

  /**
   * This is cooked.
   *
   * Get the first enabled tab that has a signature if possible, otherwise just get
   * the first enabled tab.
   */
  const [tab, setTab] = useState(
    ((): 'draw' | 'text' | 'image' => {
      // First passthrough to check to see if there's a signature for a given tab.
      if (drawSignatureEnabled && drawSignature) {
        return 'draw';
      }

      if (typedSignatureEnabled && typedSignature) {
        return 'text';
      }

      if (uploadSignatureEnabled && imageSignature) {
        return 'image';
      }

      // Second passthrough to just select the first avaliable tab.
      if (drawSignatureEnabled) {
        return 'draw';
      }

      if (typedSignatureEnabled) {
        return 'text';
      }

      if (uploadSignatureEnabled) {
        return 'image';
      }

      throw new Error('No signature enabled');
    })(),
  );

  const onImageSignatureChange = (value: string) => {
    setImageSignature(value);

    onChange?.({
      type: DocumentSignatureType.UPLOAD,
      value,
    });
  };

  const onDrawSignatureChange = (value: string) => {
    setDrawSignature(value);

    onChange?.({
      type: DocumentSignatureType.DRAW,
      value,
    });
  };

  const onTypedSignatureChange = (value: string) => {
    setTypedSignature(value);

    onChange?.({
      type: DocumentSignatureType.TYPE,
      value,
    });
  };

  const onTabChange = (value: 'draw' | 'text' | 'image') => {
    if (disabled) {
      return;
    }

    setTab(value);

    match(value)
      .with('draw', () => {
        onDrawSignatureChange(drawSignature);
      })
      .with('text', () => {
        onTypedSignatureChange(typedSignature);
      })
      .with('image', () => {
        onImageSignatureChange(imageSignature);
      })
      .exhaustive();
  };

  if (!drawSignatureEnabled && !typedSignatureEnabled && !uploadSignatureEnabled) {
    return null;
  }

  const isNexis = appearance === 'nexis';

  const tabPanelShell = cn(
    'relative text-center',
    isNexis
      ? 'nexis-signature-pad-panel mt-3 aspect-[16/11] min-h-[280px] w-full rounded-lg sm:min-h-[340px]'
      : 'aspect-signature-pad mt-4 rounded-md border border-border bg-neutral-50 dark:bg-background',
  );

  return (
    <Tabs
      defaultValue={tab}
      className={cn(
        {
          'pointer-events-none': disabled,
        },
        isNexis &&
          '[&_[role=tab][data-state=active]]:font-semibold [&_[role=tab][data-state=active]]:!text-white [&_[role=tab][data-state=inactive]]:!text-[#8E8E8E]',
      )}
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      onValueChange={(value) => onTabChange(value as 'draw' | 'text' | 'image')}
    >
      <TabsList className={cn(isNexis && 'gap-7 border-0 pb-0 pr-12 sm:gap-8 sm:pr-14')}>
        {drawSignatureEnabled && (
          <TabsTrigger
            value="draw"
            showIndicator={!isNexis}
            className={cn(isNexis && 'px-0 py-1.5')}
          >
            {!isNexis && <SignatureIcon className="mr-2 size-4" />}
            <Trans context="Draw signature">Draw</Trans>
          </TabsTrigger>
        )}

        {typedSignatureEnabled && (
          <TabsTrigger
            value="text"
            showIndicator={!isNexis}
            className={cn(isNexis && 'px-0 py-1.5')}
          >
            {!isNexis && <KeyboardIcon className="mr-2 size-4" />}
            <Trans context="Type signature">Type</Trans>
          </TabsTrigger>
        )}

        {uploadSignatureEnabled && (
          <TabsTrigger
            value="image"
            showIndicator={!isNexis}
            className={cn(isNexis && 'px-0 py-1.5')}
          >
            {!isNexis && <UploadCloudIcon className="mr-2 size-4" />}
            <Trans context="Upload signature">Upload</Trans>
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="draw" className={cn(tabPanelShell, 'flex items-center justify-center')}>
        <SignaturePadDraw
          className="h-full w-full"
          appearance={appearance}
          onChange={onDrawSignatureChange}
          value={drawSignature}
        />
      </TabsContent>

      <TabsContent value="text" className={cn(tabPanelShell, 'flex items-center justify-center')}>
        <SignaturePadType
          appearance={appearance}
          value={typedSignature}
          defaultValue={fullName}
          onChange={onTypedSignatureChange}
        />
      </TabsContent>

      <TabsContent
        value="image"
        className={cn(
          tabPanelShell,
          !isNexis && {
            'bg-white': imageSignature,
          },
        )}
      >
        <SignaturePadUpload
          appearance={appearance}
          value={imageSignature}
          onChange={onImageSignatureChange}
        />
      </TabsContent>
    </Tabs>
  );
};
