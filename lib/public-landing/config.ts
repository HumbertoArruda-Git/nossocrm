import { isValidUUID } from '@/lib/supabase/utils';

export const LANDING_SUBJECTS = ['crm', 'automacao', 'diagnostico', 'outro'] as const;
export type LandingSubject = (typeof LANDING_SUBJECTS)[number];

export function getLandingConfig() {
  const organizationId = process.env.LANDING_CRM_ORGANIZATION_ID?.trim() ?? '';
  const boardId = process.env.LANDING_CRM_BOARD_ID?.trim() ?? '';
  const stageId = process.env.LANDING_CRM_STAGE_ID?.trim() ?? '';
  const rateLimitSecret = process.env.LANDING_RATE_LIMIT_SECRET ?? '';

  if (![organizationId, boardId, stageId].every(isValidUUID) || rateLimitSecret.length < 32) {
    return null;
  }

  return {
    organizationId,
    boardId,
    stageId,
    rateLimitSecret,
    rateLimitMax: 5,
    rateLimitWindowMinutes: 15,
  };
}
