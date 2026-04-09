import type { ImgHTMLAttributes } from 'react';

import { cn } from '@documenso/ui/lib/utils';

export type LogoProps = ImgHTMLAttributes<HTMLImageElement>;

/** Same DocSeal wordmark as {@link BrandingLogo} (narrow headers reuse one asset). */
export const BrandingLogoIcon = ({ className, alt = 'DocSeal', ...props }: LogoProps) => {
  return (
    <img
      src="/static/logo-docseal.svg"
      alt={alt}
      className={cn('w-auto shrink-0 object-contain object-left', className)}
      {...props}
    />
  );
};
