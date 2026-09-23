import React, { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Activity, Board, Contact, Deal } from '@/types';
import { FocusContextPanel } from './FocusContextPanel';

const mocks = vi.hoisted(() => ({
  activities: [] as Activity[],
  record: vi.fn(),
  addToast: vi.fn(),
}));

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>) => {
    const Lazy = React.lazy(loader);
    return (props: Record<string, unknown>) => <Suspense fallback={null}><Lazy {...props} /></Suspense>;
  },
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, title, children }: { isOpen: boolean; title?: string; children: React.ReactNode }) =>
    isOpen ? <div role="dialog" aria-label={title}>{children}</div> : null,
}));
vi.mock('@/components/AIAssistant', () => ({ default: () => null }));
vi.mock('../hooks/useAIDealAnalysis', async (importOriginal) => ({
  ...await importOriginal<typeof import('../hooks/useAIDealAnalysis')>(),
  useAIDealAnalysis: () => ({ data: undefined, isLoading: false, refetch: vi.fn() }),
}));
vi.mock('../hooks/useDealNotes', () => ({
  useDealNotes: () => ({ notes: [], isLoading: false, createNote: vi.fn(), deleteNote: vi.fn() }),
}));
vi.mock('../hooks/useDealFiles', () => ({
  useDealFiles: () => ({
    files: [], isLoading: false, uploadFile: vi.fn(), deleteFile: vi.fn(), downloadFile: vi.fn(), formatFileSize: () => '',
  }),
}));
vi.mock('../hooks/useQuickScripts', () => ({
  useQuickScripts: () => ({
    scripts: [], isLoading: false, applyVariables: (text: string) => text,
    getCategoryInfo: () => ({ label: '', color: '' }), createScript: vi.fn(), updateScript: vi.fn(), deleteScript: vi.fn(),
  }),
}));
vi.mock('@/context/AIContext', () => ({ useAI: () => ({ setContext: vi.fn(), clearContext: vi.fn() }) }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ profile: { first_name: 'Humberto' } }) }));
vi.mock('@/context/ToastContext', () => ({ useToast: () => ({ addToast: mocks.addToast }) }));
vi.mock('@/lib/ai/tasksClient', () => ({ generateSalesScript: vi.fn() }));
vi.mock('@/lib/supabase/ai-proxy', () => ({ callAIProxy: vi.fn(), isConsentError: () => false, isRateLimitError: () => false }));
vi.mock('@/lib/query/hooks/useActivitiesQuery', () => ({
  useActivitiesByDeal: (dealId?: string) => ({ data: dealId ? mocks.activities : [] }),
}));
vi.mock('@/lib/whatsapp-assisted/client', () => ({ recordAssistedWhatsApp: mocks.record }));

const deal = {
  id: 'deal-1', title: 'Padaria Aurora', value: 0, probability: 10, status: 'stage-contatado',
  boardId: 'board-1', contactId: 'contact-1', createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(), tags: [], items: [], customFields: {}, isWon: false, isLost: false,
  priority: 'medium', owner: { name: 'Eu', avatar: '' },
} as unknown as Deal;
const contact = { id: 'contact-1', name: 'Ana', phone: '11999990000', email: '' } as Contact;
const board = (key: string) => ({
  id: 'board-1', key, name: 'Board', stages: [{ id: 'stage-contatado', label: 'Contatado', color: '' }],
}) as unknown as Board;

function whatsapp(id: string, event: string, extra: Partial<Activity> = {}, followUp?: number): Activity {
  return {
    id, dealId: 'deal-1', dealTitle: 'Padaria Aurora', type: event === 'follow_up_due' ? 'TASK' : 'NOTE',
    title: event, date: new Date().toISOString(), completed: event !== 'follow_up_due',
    user: { name: 'Eu', avatar: '' },
    metadata: { channel: 'whatsapp', event, ...(followUp ? { follow_up_number: followUp } : {}) },
    ...extra,
  } as Activity;
}

function renderPanel(boardKey = 'prospeccao-comercial', panelContact: Contact | null = contact) {
  const onAddActivity = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FocusContextPanel deal={deal} contact={panelContact ?? undefined} board={board(boardKey)} activities={[]}
        onMoveStage={vi.fn()} onMarkWon={vi.fn()} onMarkLost={vi.fn()} onAddActivity={onAddActivity}
        onUpdateActivity={vi.fn()} onClose={vi.fn()} isExpanded />
    </QueryClientProvider>
  );
  return { onAddActivity };
}

/** Opens the composer from the quick action and clicks "Abrir no WhatsApp". */
async function openWhatsApp() {
  fireEvent.click(screen.getAllByRole('button', { name: /^WhatsApp$/ })[0]);
  const openButtons = await screen.findAllByRole('button', { name: 'Abrir no WhatsApp' });
  fireEvent.click(openButtons.at(-1)!);
}

describe('cockpit Focus: WhatsApp assistido', () => {
  beforeEach(() => {
    mocks.activities = [];
    mocks.record.mockReset().mockResolvedValue({});
    mocks.addToast.mockReset();
    vi.stubGlobal('open', vi.fn());
  });

  it('abrir o WhatsApp não registra; só "Sim, marcar como enviado" registra o envio inicial', async () => {
    const { onAddActivity } = renderPanel();
    await openWhatsApp();
    expect(window.open).toHaveBeenCalledOnce();
    expect(mocks.record).not.toHaveBeenCalled();
    expect(onAddActivity).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Sim, marcar como enviado' }));
    await waitFor(() => expect(mocks.record).toHaveBeenCalledOnce());
    expect(mocks.record.mock.calls[0][1]).toBe(deal);
    expect(mocks.record.mock.calls[0][2]).toMatchObject({ event: 'initial_sent', requestId: expect.any(String) });
    expect(onAddActivity).not.toHaveBeenCalled();
  });

  it('com TASK pendente, a confirmação vira o follow-up daquela TASK', async () => {
    mocks.activities = [whatsapp('a1', 'initial_sent'), whatsapp('t1', 'follow_up_due', {}, 1)];
    renderPanel();
    await openWhatsApp();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, marcar como enviado' }));
    await waitFor(() => expect(mocks.record).toHaveBeenCalledOnce());
    expect(mocks.record.mock.calls[0][2]).toMatchObject({ event: 'follow_up_sent', followUpTaskId: 't1' });
  });

  it('sequência encerrada (após o follow-up 2) não reinicia: o envio vira nota simples', async () => {
    mocks.activities = [
      whatsapp('a1', 'initial_sent'),
      whatsapp('t1', 'follow_up_due', { completed: true }, 1), whatsapp('a2', 'follow_up_sent', {}, 1),
      whatsapp('t2', 'follow_up_due', { completed: true }, 2), whatsapp('a3', 'follow_up_sent', {}, 2),
    ];
    const { onAddActivity } = renderPanel();
    await openWhatsApp();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, marcar como enviado' }));
    await waitFor(() => expect(onAddActivity).toHaveBeenCalledOnce());
    expect(onAddActivity.mock.calls[0][0]).toMatchObject({ type: 'NOTE', title: 'WhatsApp', dealId: 'deal-1' });
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it('"Marcar como respondeu" usa o fluxo de resposta e some depois da resposta', async () => {
    mocks.activities = [whatsapp('a1', 'initial_sent'), whatsapp('t1', 'follow_up_due', {}, 1)];
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como respondeu' }));
    const dialog = screen.getByRole('dialog', { name: 'Marcar como respondeu' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Marcar como respondeu' }));
    await waitFor(() => expect(mocks.record).toHaveBeenCalledOnce());
    expect(mocks.record.mock.calls[0][2]).toMatchObject({ event: 'replied' });
  });

  it('depois da resposta não oferece nova resposta nem reinicia a sequência', async () => {
    mocks.activities = [whatsapp('a1', 'initial_sent'), whatsapp('r1', 'replied')];
    const { onAddActivity } = renderPanel();
    expect(screen.queryByRole('button', { name: 'Marcar como respondeu' })).toBeNull();
    await openWhatsApp();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, marcar como enviado' }));
    await waitFor(() => expect(onAddActivity).toHaveBeenCalledOnce());
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it('outros boards seguem como antes: sem pergunta de envio e sem registro', async () => {
    const { onAddActivity } = renderPanel('vendas');
    expect(screen.queryByRole('button', { name: 'Marcar como respondeu' })).toBeNull();
    await openWhatsApp();
    expect(window.open).toHaveBeenCalledOnce();
    expect(screen.queryByText('Você enviou a mensagem?')).toBeNull();
    expect(mocks.record).not.toHaveBeenCalled();
    expect(onAddActivity).not.toHaveBeenCalled();
  });

  it('deal sem contato: aceita telefone digitado e só o envia na confirmação', async () => {
    renderPanel('prospeccao-comercial', null);
    const quickAction = screen.getAllByRole('button', { name: /^WhatsApp$/ })
      .find((button) => button.textContent?.trim() === 'WhatsApp')!;
    expect(quickAction).toBeEnabled();
    fireEvent.click(quickAction);
    const phone = await screen.findByRole('textbox', { name: /Telefone para o WhatsApp/ });
    fireEvent.change(phone, { target: { value: '(21) 98888-7777' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Abrir no WhatsApp' }).at(-1)!);
    expect(mocks.record).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, marcar como enviado' }));
    await waitFor(() => expect(mocks.record).toHaveBeenCalledOnce());
    expect(mocks.record.mock.calls[0][2]).toMatchObject({ event: 'initial_sent', phone: '5521988887777' });
  });

  it('deal sem contato em outro board continua sem WhatsApp', () => {
    renderPanel('vendas', null);
    // The quick action (with visible text), not the next-best-action icon.
    const quickAction = screen.getAllByRole('button', { name: /^WhatsApp$/ })
      .find((button) => button.textContent?.trim() === 'WhatsApp');
    expect(quickAction).toBeDisabled();
  });
});
