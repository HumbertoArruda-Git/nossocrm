import type { Activity } from '@/types';

export type AssistedSendEvent = 'initial_sent' | 'follow_up_sent';
export type FollowUpDueStatus = 'today' | 'overdue' | 'upcoming';

/** Mirrors v_max_follow_ups in record_assisted_whatsapp. */
export const MAX_ASSISTED_FOLLOW_UPS = 2;

export interface AssistedWhatsAppState {
  hasConfirmedSend: boolean;
  hasReply: boolean;
  followUpsSent: number;
  pendingTask?: Activity;
  /** Event the next confirmed send records, or null when the sequence is over. */
  nextEvent: AssistedSendEvent | null;
  canMarkReplied: boolean;
}

const isAssisted = (activity: Activity, event: string) =>
  activity.metadata?.channel === 'whatsapp' && activity.metadata?.event === event;

export function isPendingFollowUpTask(activity: Activity): boolean {
  return activity.type === 'TASK' && !activity.completed && isAssisted(activity, 'follow_up_due');
}

/**
 * Where the assisted sequence stands, derived only from the deal's activities.
 * The RPC enforces the same rules; this keeps the UI from offering what it would refuse.
 */
export function assistedWhatsAppState(activities: Activity[]): AssistedWhatsAppState {
  const hasReply = activities.some((activity) => isAssisted(activity, 'replied'));
  const hasInitial = activities.some((activity) => isAssisted(activity, 'initial_sent'));
  const followUpsSent = activities.filter((activity) => isAssisted(activity, 'follow_up_sent')).length;
  const pendingTask = hasReply ? undefined : activities.find(isPendingFollowUpTask);
  const hasConfirmedSend = hasInitial || followUpsSent > 0;
  const hasStarted = hasConfirmedSend || activities.some((activity) => isAssisted(activity, 'follow_up_due'));

  let nextEvent: AssistedSendEvent | null = null;
  if (!hasReply) {
    if (pendingTask) nextEvent = 'follow_up_sent';
    else if (!hasStarted) nextEvent = 'initial_sent';
  }

  return {
    hasConfirmedSend,
    hasReply,
    followUpsSent,
    pendingTask,
    nextEvent,
    canMarkReplied: hasConfirmedSend && !hasReply,
  };
}

/** What a confirmed send records; null means an ordinary note, never a restarted sequence. */
export function assistedSendRequest(
  state: AssistedWhatsAppState
): { event: AssistedSendEvent; followUpTaskId?: string } | null {
  if (!state.nextEvent) return null;
  return state.nextEvent === 'follow_up_sent'
    ? { event: 'follow_up_sent', followUpTaskId: state.pendingTask?.id }
    : { event: 'initial_sent' };
}

const saoPauloDay =(date: Date) => date.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

export function followUpDueStatus(dueDate: string, now: Date = new Date()): FollowUpDueStatus {
  const due = saoPauloDay(new Date(dueDate));
  const today = saoPauloDay(now);
  if (due < today) return 'overdue';
  return due === today ? 'today' : 'upcoming';
}

/** Most urgent visible status per deal; upcoming follow-ups are left out on purpose. */
export function followUpAlertsByDeal(
  followUps: { dealId: string; date: string }[],
  now: Date = new Date()
): Map<string, Exclude<FollowUpDueStatus, 'upcoming'>> {
  const alerts = new Map<string, Exclude<FollowUpDueStatus, 'upcoming'>>();
  for (const followUp of followUps) {
    const status = followUpDueStatus(followUp.date, now);
    if (status === 'upcoming' || alerts.get(followUp.dealId) === 'overdue') continue;
    alerts.set(followUp.dealId, status);
  }
  return alerts;
}

export function followUpNumber(task: Activity): number {
  const value = Number(task.metadata?.follow_up_number);
  return Number.isInteger(value) && value > 0 ? value : 1;
}
