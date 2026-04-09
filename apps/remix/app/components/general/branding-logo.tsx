import type { ImgHTMLAttributes } from 'react';

import { cn } from '@documenso/ui/lib/utils';

export type LogoProps = ImgHTMLAttributes<HTMLImageElement>;

/** DocSeal wordmark — same asset as the team dashboard (`/static/logo-docseal.svg`). */
export const BrandingLogo = ({ className, alt = 'DocSeal', ...props }: LogoProps) => {
  return (
    <img
      src="/static/logo-docseal.svg"
      alt={alt}
      className={cn('w-auto shrink-0 object-contain object-left', className)}
      {...props}
    />
  );
};
