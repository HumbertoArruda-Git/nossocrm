import type { QueryClient } from '@tanstack/react-query';
import { DEALS_VIEW_KEY, queryKeys } from '@/lib/query';
import type { DealView } from '@/types';

export type AssistedWhatsAppEvent = 'initial_sent' | 'follow_up_sent' | 'replied';

export interface AssistedWhatsAppRequest {
  event: AssistedWhatsAppEvent;
  message: string;
  requestId: string;
  followUpTaskId?: string;
}

export interface AssistedWhatsAppResult {
  stage_id?: string;
  duplicate?: boolean;
}

/** Records a manually confirmed step and syncs the deal and activity caches. */
export async function recordAssistedWhatsApp(
  queryClient: QueryClient,
  deal: Pick<DealView, 'id' | 'status'>,
  request: AssistedWhatsAppRequest
): Promise<AssistedWhatsAppResult> {
  const response = await fetch(`/api/deals/${deal.id}/whatsapp-assisted`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error('Não foi possível registrar a confirmação.');
  const result = await response.json() as AssistedWhatsAppResult;
  if (result.stage_id && result.stage_id !== deal.status) {
    queryClient.setQueryData<DealView[]>(DEALS_VIEW_KEY, (current) =>
      current?.map((item) => item.id === deal.id
        ? { ...item, status: result.stage_id!, lastStageChangeDate: new Date().toISOString() }
        : item));
  }
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.lists() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byDeal(deal.id) }),
  ]);
  return result;
}
