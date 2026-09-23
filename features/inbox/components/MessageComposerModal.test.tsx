import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MessageComposerModal } from './MessageComposerModal';

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div role="dialog">{children}</div> : null,
}));

describe('compositor WhatsApp do cockpit', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('open', vi.fn());
  });

  it('abrir não dispara onExecuted; só a confirmação dispara', () => {
    const onExecuted = vi.fn();
    render(<MessageComposerModal isOpen onClose={vi.fn()} channel="WHATSAPP"
      contactPhone="(11) 99999-0000" initialMessage="Olá, Ana!"
      onExecuted={onExecuted} requireWhatsAppConfirmation />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Abrir no WhatsApp' }).at(-1)!);
    expect(window.open).toHaveBeenCalledOnce();
    expect(onExecuted).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, marcar como enviado' }));
    expect(onExecuted).toHaveBeenCalledOnce();
    expect(onExecuted.mock.calls[0][0]).toMatchObject({
      channel: 'WHATSAPP', message: 'Olá, Ana!',
    });
  });

  it('permite desistir sem registrar e recusa telefone inválido', () => {
    const onExecuted = vi.fn();
    const onClose = vi.fn();
    render(<MessageComposerModal isOpen onClose={onClose} channel="WHATSAPP"
      contactPhone="1199" initialMessage="Olá" onExecuted={onExecuted}
      requireWhatsAppConfirmation />);
    expect(screen.getAllByRole('button', { name: 'Abrir no WhatsApp' }).at(-1)).toBeDisabled();
    expect(window.open).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onExecuted).not.toHaveBeenCalled();
  });
});
