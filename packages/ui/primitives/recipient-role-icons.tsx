import type { RecipientRole } from '@prisma/client';
import { BadgeCheck, Copy, Eye, User } from 'lucide-react';

/** Served from `apps/remix/public/static` (Nexis envelope chrome). */
export const RECIPIENT_ROLE_SIGNER_ICON_SRC = '/static/PencilSimple.svg';

export const ROLE_ICONS: Record<RecipientRole, JSX.Element> = {
  SIGNER: (
    <img
      src={RECIPIENT_ROLE_SIGNER_ICON_SRC}
      alt=""
      className="h-[18px] w-[18px] shrink-0 object-contain"
      aria-hidden
    />
  ),
  APPROVER: <BadgeCheck className="h-4 w-4" />,
  CC: <Copy className="h-4 w-4" />,
  VIEWER: <Eye className="h-4 w-4" />,
  ASSISTANT: <User className="h-4 w-4" />,
};
