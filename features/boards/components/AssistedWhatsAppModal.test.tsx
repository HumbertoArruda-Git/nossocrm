import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Contact, DealView } from '@/types';
import { AssistedWhatsAppModal } from './AssistedWhatsAppModal';

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div role="dialog">{children}</div> : null,
}));

const deal = {
  id: '00000000-0000-4000-8000-000000000131',
  title: 'Acme',
  status: '00000000-0000-4000-8000-000000000111',
  customFields: { mensagemInicial: 'Olá, [Nome]!\nA&B?' },
} as DealView;
const contact = {
  id: '00000000-0000-4000-8000-000000000121',
  name: 'Ana',
  phone: '(11) 99999-0000',
} as Contact;

function renderModal(mode: 'initial_sent' | 'follow_up_sent' | 'replied' = 'initial_sent') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <AssistedWhatsAppModal isOpen mode={mode} deal={deal} contact={contact}
        followUpTaskId="00000000-0000-4000-8000-000000000151" onClose={onClose} />
    </QueryClientProvider>
  );
  return { client, onClose };
}

describe('WhatsApp assistido: confirmação manual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('open', vi.fn());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ stage_id: '00000000-0000-4000-8000-000000000112', duplicate: false }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )));
  });

  it('abrir o WhatsApp não registra envio; cancelar não escreve nada', () => {
    const { onClose } = renderModal();
    expect((screen.getByRole('textbox', { name: 'Mensagem' }) as HTMLTextAreaElement).value)
      .toBe('Olá, Ana!\nA&B?');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir WhatsApp' }));
    expect(window.open).toHaveBeenCalledWith(
      'https://wa.me/5511999990000?text=' + encodeURIComponent('Olá, Ana!\nA&B?'),
      '_blank', 'noopener,noreferrer'
    );
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Ainda não' }));
    expect(fetch).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('registra só após confirmação e impede duplo clique', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir WhatsApp' }));
    const confirm = screen.getByRole('button', { name: 'Sim, marcar como enviado' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.event).toBe('initial_sent');
    expect(body.message).toBe('Olá, Ana!\nA&B?');
  });

  it('não abre número inválido', () => {
    renderModal();
    fireEvent.change(screen.getByRole('textbox', { name: 'Telefone' }), { target: { value: '1199' } });
    expect(screen.getByRole('button', { name: 'Abrir WhatsApp' })).toBeDisabled();
    expect(window.open).not.toHaveBeenCalled();
  });

  it('conclui um follow-up vinculado à TASK', async () => {
    renderModal('follow_up_sent');
    fireEvent.click(screen.getByRole('button', { name: 'Abrir WhatsApp' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sim, marcar como enviado' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.event).toBe('follow_up_sent');
    expect(body.followUpTaskId).toBe('00000000-0000-4000-8000-000000000151');
  });

  it('registra resposta sem abrir WhatsApp', async () => {
    renderModal('replied');
    fireEvent.change(screen.getByRole('textbox', { name: /Observação/ }), {
      target: { value: 'Cliente pediu reunião' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como respondeu' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(window.open).not.toHaveBeenCalled();
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.event).toBe('replied');
    expect(body.message).toBe('Cliente pediu reunião');
  });
});
