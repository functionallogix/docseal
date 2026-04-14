import type { MouseEvent, PointerEvent, RefObject, TouchEvent } from 'react';
import { useMemo, useRef, useState } from 'react';

import { Trans } from '@lingui/react/macro';
import { Undo2 } from 'lucide-react';
import type { StrokeOptions } from 'perfect-freehand';
import { getStroke } from 'perfect-freehand';

import { unsafe_useEffectOnce } from '@documenso/lib/client-only/hooks/use-effect-once';
import {
  SIGNATURE_CANVAS_DPI,
  SIGNATURE_MIN_COVERAGE_THRESHOLD,
} from '@documenso/lib/constants/signatures';

import { cn } from '../../lib/utils';
import { getSvgPathFromStroke } from './helper';
import { Point } from './point';
import { SignaturePadColorPicker } from './signature-pad-color-picker';

const checkSignatureValidity = (element: RefObject<HTMLCanvasElement>) => {
  if (!element.current) {
    return false;
  }

  const ctx = element.current.getContext('2d');

  if (!ctx) {
    return false;
  }

  const imageData = ctx.getImageData(0, 0, element.current.width, element.current.height);
  const data = imageData.data;
  let filledPixels = 0;
  const totalPixels = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) filledPixels++;
  }

  const filledPercentage = filledPixels / totalPixels;
  const isValid = filledPercentage > SIGNATURE_MIN_COVERAGE_THRESHOLD;

  return isValid;
};

export type SignaturePadDrawProps = {
  className?: string;
  value: string;
  onChange: (_signatureDataUrl: string) => void;
  appearance?: 'default' | 'nexis';
};

/**
 */
const resolveDisplayStrokeColor = (selectedColor: string, appearance: 'default' | 'nexis') => {
  if (appearance !== 'nexis') {
    return selectedColor;
  }

  const map: Record<string, string> = {
    black: '#ffffff',
    white: '#EEF1F5',
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
  };

  return map[selectedColor] ?? selectedColor;
};

/** Final RGB for Nexis PNG (may differ from on-screen preview for black/white). */
const resolveNexisPlacementFill = (selectedColor: string) => {
  const map: Record<string, string> = {
    black: '#0a0a0a',
    white: '#ffffff',
    red: '#ef4444',
    blue: '#3b82f6',
    green: '#22c55e',
  };

  return map[selectedColor] ?? selectedColor;
};

const renderLinesToDataUrl = (
  lineData: Point[][],
  width: number,
  height: number,
  fillStyle: string,
  options: StrokeOptions,
) => {
  if (typeof document === 'undefined') {
    return '';
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = fillStyle;

  lineData.forEach((line) => {
    const pathData = new Path2D(getSvgPathFromStroke(getStroke(line, options)));
    ctx.fill(pathData);
  });

  return canvas.toDataURL();
};

export const SignaturePadDraw = ({
  className,
  value,
  onChange,
  appearance = 'default',
  ...props
}: SignaturePadDrawProps) => {
  const $el = useRef<HTMLCanvasElement>(null);

  const $imageData = useRef<ImageData | null>(null);
  const $fileInput = useRef<HTMLInputElement>(null);

  const [isPressed, setIsPressed] = useState(false);
  const [lines, setLines] = useState<Point[][]>([]);
  const [currentLine, setCurrentLine] = useState<Point[]>([]);
  const [isSignatureValid, setIsSignatureValid] = useState<boolean | null>(null);

  const [selectedColor, setSelectedColor] = useState('black');

  const displayStrokeColor = resolveDisplayStrokeColor(selectedColor, appearance);

  const perfectFreehandOptions = useMemo(() => {
    const size = $el.current ? Math.min($el.current.height, $el.current.width) * 0.03 : 10;

    return {
      size,
      thinning: 0.25,
      streamline: 0.5,
      smoothing: 0.5,
      end: {
        taper: size * 2,
      },
    } satisfies StrokeOptions;
  }, []);

  const getSignatureDataUrlForExport = (lineData: Point[][]) => {
    if (!$el.current || lineData.length === 0) {
      return '';
    }

    const { width, height } = $el.current;

    if (appearance === 'nexis') {
      return renderLinesToDataUrl(
        lineData,
        width,
        height,
        resolveNexisPlacementFill(selectedColor),
        perfectFreehandOptions,
      );
    }

    return $el.current.toDataURL();
  };

  const onMouseDown = (event: MouseEvent | PointerEvent | TouchEvent) => {
    if (event.cancelable) {
      event.preventDefault();
    }

    setIsPressed(true);

    const point = Point.fromEvent(event, SIGNATURE_CANVAS_DPI, $el.current);

    setCurrentLine([point]);
  };

  const onMouseMove = (event: MouseEvent | PointerEvent | TouchEvent) => {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (!isPressed) {
      return;
    }

    const point = Point.fromEvent(event, SIGNATURE_CANVAS_DPI, $el.current);
    const lastPoint = currentLine[currentLine.length - 1];

    if (lastPoint && point.distanceTo(lastPoint) > 5) {
      setCurrentLine([...currentLine, point]);

      // Update the canvas here to draw the lines
      if ($el.current) {
        const ctx = $el.current.getContext('2d');

        if (ctx) {
          ctx.restore();
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = displayStrokeColor;

          lines.forEach((line) => {
            const pathData = new Path2D(
              getSvgPathFromStroke(getStroke(line, perfectFreehandOptions)),
            );

            ctx.fill(pathData);
          });

          const pathData = new Path2D(
            getSvgPathFromStroke(getStroke([...currentLine, point], perfectFreehandOptions)),
          );
          ctx.fill(pathData);
        }
      }
    }
  };

  const onMouseUp = (event: MouseEvent | PointerEvent | TouchEvent, addLine = true) => {
    if (event.cancelable) {
      event.preventDefault();
    }

    setIsPressed(false);

    const point = Point.fromEvent(event, SIGNATURE_CANVAS_DPI, $el.current);

    const newLines = [...lines];

    if (addLine && currentLine.length > 0) {
      newLines.push([...currentLine, point]);
      setCurrentLine([]);
    }

    setLines(newLines);

    if ($el.current && newLines.length > 0) {
      const ctx = $el.current.getContext('2d');

      if (ctx) {
        ctx.restore();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = displayStrokeColor;

        newLines.forEach((line) => {
          const pathData = new Path2D(
            getSvgPathFromStroke(getStroke(line, perfectFreehandOptions)),
          );
          ctx.fill(pathData);
        });

        const isValidSignature = checkSignatureValidity($el);

        setIsSignatureValid(isValidSignature);

        if (isValidSignature) {
          onChange?.(getSignatureDataUrlForExport(newLines));
        }
        ctx.save();
      }
    }
  };

  const onMouseEnter = (event: MouseEvent | PointerEvent | TouchEvent) => {
    if (event.cancelable) {
      event.preventDefault();
    }

    if ('buttons' in event && event.buttons === 1) {
      onMouseDown(event);
    }
  };

  const onMouseLeave = (event: MouseEvent | PointerEvent | TouchEvent) => {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (isPressed) {
      onMouseUp(event, true);
    } else {
      onMouseUp(event, false);
    }
  };

  const onClearClick = () => {
    if ($el.current) {
      const ctx = $el.current.getContext('2d');

      ctx?.clearRect(0, 0, $el.current.width, $el.current.height);
      $imageData.current = null;
    }

    if ($fileInput.current) {
      $fileInput.current.value = '';
    }

    onChange('');

    setLines([]);
    setCurrentLine([]);
    setIsPressed(false);
  };

  const onUndoClick = () => {
    if (lines.length === 0 || !$el.current) {
      return;
    }

    const newLines = lines.slice(0, -1);
    setLines(newLines);

    // Clear and redraw the canvas
    const ctx = $el.current.getContext('2d');
    const { width, height } = $el.current;
    ctx?.clearRect(0, 0, width, height);

    if ($imageData.current) {
      ctx?.putImageData($imageData.current, 0, 0);
    }

    if (ctx) {
      ctx.fillStyle = displayStrokeColor;
    }

    newLines.forEach((line) => {
      const pathData = new Path2D(getSvgPathFromStroke(getStroke(line, perfectFreehandOptions)));
      ctx?.fill(pathData);
    });

    onChange?.(getSignatureDataUrlForExport(newLines));
  };

  unsafe_useEffectOnce(() => {
    if ($el.current) {
      $el.current.width = $el.current.clientWidth * SIGNATURE_CANVAS_DPI;
      $el.current.height = $el.current.clientHeight * SIGNATURE_CANVAS_DPI;
    }

    if ($el.current && value) {
      const ctx = $el.current.getContext('2d');

      const { width, height } = $el.current;

      const img = new Image();

      img.onload = () => {
        ctx?.drawImage(img, 0, 0, Math.min(width, img.width), Math.min(height, img.height));

        const defaultImageData = ctx?.getImageData(0, 0, width, height) || null;

        $imageData.current = defaultImageData;
      };

      img.src = value;
    }
  });

  return (
    <div className={cn('h-full w-full', className)}>
      <canvas
        data-testid="signature-pad-draw"
        ref={$el}
        className={cn('h-full w-full', {
          'dark:hue-rotate-180 dark:invert': selectedColor === 'black' && appearance === 'default',
        })}
        style={{ touchAction: 'none' }}
        onPointerMove={(event) => onMouseMove(event)}
        onPointerDown={(event) => onMouseDown(event)}
        onPointerUp={(event) => onMouseUp(event)}
        onPointerLeave={(event) => onMouseLeave(event)}
        onPointerEnter={(event) => onMouseEnter(event)}
        {...props}
      />

      <SignaturePadColorPicker
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        appearance={appearance}
      />

      {appearance === 'nexis' ? (
        <>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <button
              type="button"
              title="undo"
              disabled={lines.length === 0}
              className={cn(
                'rounded-full p-0 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#48EAE5]/40',
                lines.length === 0 ? 'text-white/25' : 'text-white hover:text-white/90',
              )}
              onClick={onUndoClick}
            >
              <Undo2 className="h-5 w-5" />
              <span className="sr-only">
                <Trans>Undo</Trans>
              </span>
            </button>

            <button
              type="button"
              className="text-[0.688rem] text-[#8E8E8E] transition hover:text-[#b5b5b5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#48EAE5]/40"
              onClick={() => onClearClick()}
            >
              <Trans>Clear Signature</Trans>
            </button>
          </div>

          {isSignatureValid === false && (
            <div className="absolute bottom-12 left-3 right-3 flex justify-center">
              <span className="text-xs text-red-400">
                <Trans>Signature is too small</Trans>
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              className="rounded-full p-0 text-[0.688rem] text-muted-foreground/60 ring-offset-background hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onClearClick()}
            >
              <Trans>Clear Signature</Trans>
            </button>
          </div>

          {isSignatureValid === false && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              <span className="text-xs text-destructive">
                <Trans>Signature is too small</Trans>
              </span>
            </div>
          )}

          {isSignatureValid && lines.length > 0 && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              <button
                type="button"
                title="undo"
                className="rounded-full p-0 text-[0.688rem] text-muted-foreground/60 ring-offset-background hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={onUndoClick}
              >
                <Undo2 className="h-4 w-4" />
                <span className="sr-only">
                  <Trans>Undo</Trans>
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
