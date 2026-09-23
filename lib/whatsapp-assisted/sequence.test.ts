import { describe, expect, it } from 'vitest';
import type { Activity } from '@/types';
import {
  assistedSendRequest,
  assistedWhatsAppState,
  followUpAlertsByDeal,
  followUpDueStatus,
  followUpNumber,
} from './sequence';

function whatsapp(id: string, event: string, extra: Partial<Activity> = {}, followUp?: number): Activity {
  return {
    id,
    dealId: 'deal-1',
    dealTitle: 'Deal',
    type: event === 'follow_up_due' ? 'TASK' : 'NOTE',
    title: event,
    date: '2026-09-25T12:00:00.000Z',
    completed: event !== 'follow_up_due',
    user: { name: 'Eu', avatar: '' },
    metadata: { channel: 'whatsapp', event, ...(followUp ? { follow_up_number: followUp } : {}) },
    ...extra,
  } as Activity;
}

const initial = whatsapp('a1', 'initial_sent');
const task1Pending = whatsapp('t1', 'follow_up_due', {}, 1);
const task1Done = whatsapp('t1', 'follow_up_due', { completed: true }, 1);
const followUp1 = whatsapp('a2', 'follow_up_sent', {}, 1);
const task2Pending = whatsapp('t2', 'follow_up_due', {}, 2);
const task2Done = whatsapp('t2', 'follow_up_due', { completed: true }, 2);
const followUp2 = whatsapp('a3', 'follow_up_sent', {}, 2);
const replied = whatsapp('r1', 'replied');

/** What the cockpit records after "Sim, marcar como enviado". */
const cockpitSend = (activities: Activity[]) => assistedSendRequest(assistedWhatsAppState(activities));

describe('sequência do WhatsApp assistido (regras usadas pelo modal e pelo cockpit)', () => {
  it('A) nada confirmado ainda: initial_sent', () => {
    expect(cockpitSend([])).toEqual({ event: 'initial_sent' });
    expect(assistedWhatsAppState([]).canMarkReplied).toBe(false);
  });

  it('B) inicial confirmada e TASK 1 pendente: follow_up_sent vinculado à TASK 1', () => {
    expect(cockpitSend([initial, task1Pending])).toEqual({ event: 'follow_up_sent', followUpTaskId: 't1' });
    expect(assistedWhatsAppState([initial, task1Pending]).canMarkReplied).toBe(true);
  });

  it('C) follow-up 1 concluído e TASK 2 pendente: follow_up_sent vinculado à TASK 2', () => {
    const state = assistedWhatsAppState([initial, task1Done, followUp1, task2Pending]);
    expect(assistedSendRequest(state)).toEqual({ event: 'follow_up_sent', followUpTaskId: 't2' });
    expect(followUpNumber(state.pendingTask!)).toBe(2);
    expect(state.followUpsSent).toBe(1);
  });

  it('D) follow-up 2 concluído: nenhum evento de sequência, nunca volta a initial_sent', () => {
    const state = assistedWhatsAppState([initial, task1Done, followUp1, task2Done, followUp2]);
    expect(state.nextEvent).toBeNull();
    expect(assistedSendRequest(state)).toBeNull();
    expect(state.canMarkReplied).toBe(true);
  });

  it('E) lead respondeu: sequência encerrada mesmo com TASK ainda aberta no cache', () => {
    for (const activities of [[initial, task1Done, replied], [initial, task1Pending, replied]]) {
      const state = assistedWhatsAppState(activities);
      expect(state.nextEvent).toBeNull();
      expect(state.pendingTask).toBeUndefined();
      expect(state.canMarkReplied).toBe(false);
    }
  });

  it('F) sequência iniciada sem TASK pendente (etapa avançada): não reinicia', () => {
    expect(cockpitSend([initial])).toBeNull();
  });

  it('ignora atividades que não são do WhatsApp assistido', () => {
    const task = { ...task1Pending, metadata: {} } as Activity;
    expect(cockpitSend([task])).toEqual({ event: 'initial_sent' });
  });

  it('TASK antiga sem número conta como follow-up 1', () => {
    expect(followUpNumber({ ...task1Pending, metadata: { channel: 'whatsapp', event: 'follow_up_due' } } as Activity)).toBe(1);
  });
});

describe('vencimento do follow-up (fuso de São Paulo)', () => {
  const now = new Date('2026-09-23T15:00:00.000Z'); // 12:00 em São Paulo

  it('distingue vencido, hoje e futuro', () => {
    expect(followUpDueStatus('2026-09-22T12:00:00.000Z', now)).toBe('overdue');
    expect(followUpDueStatus('2026-09-23T12:00:00.000Z', now)).toBe('today');
    expect(followUpDueStatus('2026-09-25T12:00:00.000Z', now)).toBe('upcoming');
  });

  it('usa o dia de São Paulo, não o UTC', () => {
    // 01:00 UTC de 24/09 ainda é 22:00 de 23/09 em São Paulo.
    expect(followUpDueStatus('2026-09-24T01:00:00.000Z', now)).toBe('today');
  });

  it('alertas do Kanban: omite futuros e prioriza vencido', () => {
    const alerts = followUpAlertsByDeal([
      { dealId: 'd1', date: '2026-09-23T12:00:00.000Z' },
      { dealId: 'd1', date: '2026-09-20T12:00:00.000Z' },
      { dealId: 'd2', date: '2026-09-23T12:00:00.000Z' },
      { dealId: 'd3', date: '2026-09-28T12:00:00.000Z' },
    ], now);
    expect(alerts.get('d1')).toBe('overdue');
    expect(alerts.get('d2')).toBe('today');
    expect(alerts.has('d3')).toBe(false);
  });
});
