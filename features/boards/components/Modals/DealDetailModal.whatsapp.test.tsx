import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Activity } from '@/types';

import { DealDetailModal } from './DealDetailModal';

const fixtures = vi.hoisted(() => ({ activities: [] as Activity[] }));

const deal = {
  id: 'deal-1',
  title: 'Padaria Central',
  value: 0,
  status: 'stage-contatado',
  boardId: 'board-prospeccao',
  contactId: 'contact-1',
  companyName: 'Padaria Central',
  contactName: 'Ana',
  contactEmail: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  probability: 10,
  priority: 'medium',
  owner: { name: 'Eu', avatar: '' },
  tags: [],
  items: [],
  customFields: {},
  isWon: false,
  isLost: false,
};

const board = {
  id: 'board-prospeccao',
  key: 'prospeccao-comercial',
  name: 'Prospecção',
  stages: [{ id: 'stage-contatado', label: 'Contatado', order: 3 }],
  wonStageId: null,
  lostStageId: null,
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));
vi.mock('@/hooks/useResponsiveMode', () => ({ useResponsiveMode: () => ({ mode: 'desktop' }) }));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ profile: { id: 'user-1', role: 'admin', organization_id: 'org-1' } }),
}));
vi.mock('@/context/ToastContext', () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useQuery: (options: { enabled?: boolean }) =>
      options.enabled === false ? { data: [deal], isLoading: false } : { data: [], isLoading: false },
  };
});
vi.mock('@/lib/query/hooks', () => {
  const mutation = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false });
  return {
    useMoveDealSimple: () => ({ moveDeal: vi.fn() }),
    useContacts: () => ({ data: [{ id: 'contact-1', name: 'Ana', phone: '11999990000' }] }),
    useActivitiesByDeal: () => ({ data: fixtures.activities }),
    useBoards: () => ({ data: [board] }),
    useLifecycleStages: () => ({ data: [] }),
    useUpdateDeal: mutation,
    useDeleteDeal: mutation,
    useAddDealItem: mutation,
    useRemoveDealItem: mutation,
    useCreateActivity: mutation,
    useUpdateActivity: mutation,
    useDeleteActivity: mutation,
  };
});
vi.mock('@/lib/query/hooks/useProductsQuery', () => ({ useActiveProducts: () => ({ data: [] }) }));
vi.mock('@/store/uiState', () => ({ useUIState: () => ({ activeBoardId: 'board-prospeccao' }) }));
vi.mock('@/hooks/usePersistedState', () => ({
  usePersistedState: (_key: string, initial: unknown) => [initial, vi.fn()],
}));
vi.mock('@/lib/a11y', () => ({
  FocusTrap: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useFocusReturn: () => undefined,
}));
vi.mock('@/components/ConfirmModal', () => ({ default: () => null }));
vi.mock('@/components/ui/LossReasonModal', () => ({ LossReasonModal: () => null }));
vi.mock('../DealSheet', () => ({
  DealSheet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../StageProgressBar', () => ({ StageProgressBar: () => null }));
vi.mock('../DealCommercialMessages', () => ({ DealCommercialMessages: () => null }));
vi.mock('@/features/activities/components/ActivityRow', () => ({ ActivityRow: () => null }));
vi.mock('@/lib/ai/tasksClient', () => ({
  analyzeLead: vi.fn(), generateEmailDraft: vi.fn(), generateObjectionResponse: vi.fn(),
}));
vi.mock('@/features/deals/components/BriefingDrawer', () => ({ BriefingDrawer: () => null }));
vi.mock('@/features/deals/components/AIExtractedFields', () => ({ AIExtractedFields: () => null }));
vi.mock('../AssistedWhatsAppModal', () => ({
  AssistedWhatsAppModal: (props: {
    isOpen: boolean; mode: string; followUpTaskId?: string; followUpNumber?: number;
  }) => props.isOpen ? (
    <div data-testid="assisted" data-mode={props.mode}
      data-task={props.followUpTaskId ?? ''} data-number={props.followUpNumber ?? ''} />
  ) : null,
}));

const DAY = 24 * 60 * 60 * 1000;

function whatsapp(id: string, event: string, extra: Partial<Activity> = {}, followUp?: number): Activity {
  return {
    id,
    dealId: 'deal-1',
    dealTitle: 'Padaria Central',
    type: event === 'follow_up_due' ? 'TASK' : 'NOTE',
    title: event,
    date: new Date().toISOString(),
    completed: event !== 'follow_up_due',
    user: { name: 'Eu', avatar: '' },
    metadata: { channel: 'whatsapp', event, ...(followUp ? { follow_up_number: followUp } : {}) },
    ...extra,
  } as Activity;
}

const future = () => new Date(Date.now() + 3 * DAY).toISOString();

function openAssisted() {
  fireEvent.click(screen.getByRole('button', { name: /Abrir WhatsApp/ }));
  return screen.getByTestId('assisted');
}

describe('DealDetailModal: sequência do WhatsApp assistido', () => {
  beforeEach(() => {
    fixtures.activities = [];
  });

  it('sem histórico: oferece só a mensagem inicial', () => {
    render(<DealDetailModal dealId="deal-1" isOpen onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Marcar como respondeu' })).toBeNull();
    expect(openAssisted().dataset.mode).toBe('initial_sent');
  });

  it('inicial confirmada com TASK 1 pendente: abre o follow-up 1 vinculado à TASK', () => {
    fixtures.activities = [
      whatsapp('a1', 'initial_sent'),
      whatsapp('t1', 'follow_up_due', { date: future() }, 1),
    ];
    render(<DealDetailModal dealId="deal-1" isOpen onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Marcar como respondeu' })).toBeInTheDocument();
    expect(screen.getByText(/Follow-up 1 pendente/)).toBeInTheDocument();
    const modal = openAssisted();
    expect(modal.dataset.mode).toBe('follow_up_sent');
    expect(modal.dataset.task).toBe('t1');
    expect(modal.dataset.number).toBe('1');
  });

  it('follow-up 1 concluído com TASK 2 vencida: abre o follow-up 2', () => {
    fixtures.activities = [
      whatsapp('a1', 'initial_sent'),
      whatsapp('t1', 'follow_up_due', { completed: true }, 1),
      whatsapp('a2', 'follow_up_sent', {}, 1),
      whatsapp('t2', 'follow_up_due', { date: new Date(Date.now() - 3 * DAY).toISOString() }, 2),
    ];
    render(<DealDetailModal dealId="deal-1" isOpen onClose={() => {}} />);
    expect(screen.getByText(/Follow-up 2 vencido/)).toBeInTheDocument();
    const modal = openAssisted();
    expect(modal.dataset.mode).toBe('follow_up_sent');
    expect(modal.dataset.task).toBe('t2');
    expect(modal.dataset.number).toBe('2');
  });

  it('follow-up 2 concluído: encerra os lembretes e não oferece novo envio', () => {
    fixtures.activities = [
      whatsapp('a1', 'initial_sent'),
      whatsapp('t1', 'follow_up_due', { completed: true }, 1),
      whatsapp('a2', 'follow_up_sent', {}, 1),
      whatsapp('t2', 'follow_up_due', { completed: true }, 2),
      whatsapp('a3', 'follow_up_sent', {}, 2),
    ];
    render(<DealDetailModal dealId="deal-1" isOpen onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /Abrir WhatsApp/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Marcar como respondeu' })).toBeInTheDocument();
  });

  it('lead respondeu: não reinicia a sequência nem pede nova resposta', () => {
    fixtures.activities = [
      whatsapp('a1', 'initial_sent'),
      whatsapp('t1', 'follow_up_due', { completed: true }, 1),
      whatsapp('r1', 'replied'),
    ];
    render(<DealDetailModal dealId="deal-1" isOpen onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /Abrir WhatsApp/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Marcar como respondeu' })).toBeNull();
  });

  it('"Marcar como respondeu" abre o modo de resposta', () => {
    fixtures.activities = [whatsapp('a1', 'initial_sent'), whatsapp('t1', 'follow_up_due', {}, 1)];
    render(<DealDetailModal dealId="deal-1" isOpen onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como respondeu' }));
    expect(screen.getByTestId('assisted').dataset.mode).toBe('replied');
  });
});
