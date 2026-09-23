import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Contact, DealView } from '@/types';
import { AssistedWhatsAppModal } from './AssistedWhatsAppModal';

const auth = vi.hoisted(() => ({ profile: { first_name: 'Humberto', last_name: null, nickname: null } as Record<string, unknown> | null }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ profile: auth.profile }) }));

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

function renderModal(
  mode: 'initial_sent' | 'follow_up_sent' | 'replied' = 'initial_sent',
  overrides: { deal?: DealView; contact?: Contact | null } = {}
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <AssistedWhatsAppModal isOpen mode={mode} deal={overrides.deal ?? deal}
        contact={overrides.contact === undefined ? contact : overrides.contact}
        followUpTaskId="00000000-0000-4000-8000-000000000151" onClose={onClose} />
    </QueryClientProvider>
  );
  return { client, onClose };
}

describe('WhatsApp assistido: confirmação manual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    auth.profile = { first_name: 'Humberto', last_name: null, nickname: null };
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

  it('nunca escreve o rótulo "Sem empresa" na mensagem; usa o título do deal', () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <AssistedWhatsAppModal isOpen mode="initial_sent" contact={contact} onClose={vi.fn()}
          deal={{ ...deal, companyName: 'Sem empresa', clientCompanyName: 'Sem empresa',
            customFields: { mensagemInicial: 'Vi a [Empresa]' } } as DealView} />
      </QueryClientProvider>
    );
    expect((screen.getByRole('textbox', { name: 'Mensagem' }) as HTMLTextAreaElement).value).toBe('Vi a Acme');
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

  it('deal sem contato: digitar telefone, abrir e desistir não grava nada', () => {
    const { onClose } = renderModal('initial_sent', { contact: null });
    expect(screen.getByText(/só será salvo se você confirmar/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: /Telefone/ }), { target: { value: '(21) 98888-7777' } });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir WhatsApp' }));
    expect((window.open as ReturnType<typeof vi.fn>).mock.calls[0][0]).toMatch(/^https:\/\/wa\.me\/5521988887777\?/);
    fireEvent.click(screen.getByRole('button', { name: 'Ainda não' }));
    expect(fetch).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('deal sem contato: a confirmação envia o telefone com que o WhatsApp foi aberto', async () => {
    renderModal('initial_sent', { contact: null });
    fireEvent.change(screen.getByRole('textbox', { name: /Telefone/ }), { target: { value: '(21) 98888-7777' } });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir WhatsApp' }));
    const confirm = screen.getByRole('button', { name: 'Sim, marcar como enviado' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body).toMatchObject({ event: 'initial_sent', phone: '5521988887777' });
  });

  it('resposta nunca envia telefone', async () => {
    renderModal('replied');
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como respondeu' }));
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body).phone).toBeUndefined();
  });

  it('[seu nome] da mensagem do Prospector vira o nome do usuário logado', () => {
    renderModal('initial_sent', {
      deal: { ...deal, customFields: { mensagemInicial: 'Oi! Aqui é [Seu Nome], da HGA.' } } as DealView,
    });
    expect((screen.getByRole('textbox', { name: 'Mensagem' }) as HTMLTextAreaElement).value)
      .toBe('Oi! Aqui é Humberto, da HGA.');
  });

  it('[seu nome] sem nome no perfil some da mensagem', () => {
    auth.profile = { first_name: null, last_name: null, nickname: null };
    renderModal('initial_sent', {
      deal: { ...deal, customFields: { mensagemInicial: 'Oi!\nAbraço,\n[SEU NOME]' } } as DealView,
    });
    expect((screen.getByRole('textbox', { name: 'Mensagem' }) as HTMLTextAreaElement).value).toBe('Oi!\nAbraço,');
  });
});
