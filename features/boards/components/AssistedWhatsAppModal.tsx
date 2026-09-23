import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { validatedWhatsAppPhone, whatsAppUrl } from '@/lib/whatsapp-assisted/phone';
import { assistedMessage } from '@/lib/whatsapp-assisted/message';
import { recordAssistedWhatsApp, type AssistedWhatsAppEvent } from '@/lib/whatsapp-assisted/client';
import type { Contact, DealView } from '@/types';

type Mode = AssistedWhatsAppEvent;

export function AssistedWhatsAppModal({
  isOpen, mode, deal, contact, followUpTaskId, followUpNumber, onClose,
}: {
  isOpen: boolean;
  mode: Mode;
  deal: DealView;
  contact: Contact | null;
  followUpTaskId?: string;
  followUpNumber?: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [openedMessage, setOpenedMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef('');
  const inFlight = useRef(false);
  const company = deal.clientCompanyName || deal.companyName || deal.title;

  useEffect(() => {
    if (!isOpen) return;
    const source = mode === 'replied' ? '' :
      assistedMessage(mode, deal.customFields, contact?.name || '', company);
    setPhone(contact?.phone || '');
    setMessage(source);
    setOpenedMessage(null);
    setError('');
    setBusy(false);
    inFlight.current = false;
    requestId.current = crypto.randomUUID();
  }, [isOpen, mode, deal.id, contact?.id, contact?.phone, contact?.name, company, deal.customFields?.mensagemInicial]);

  const validPhone = validatedWhatsAppPhone(phone);
  const isReply = mode === 'replied';
  const handleOpen = () => {
    if (!validPhone || !message.trim()) return;
    const text = message.trim();
    window.open(whatsAppUrl(validPhone, text), '_blank', 'noopener,noreferrer');
    setOpenedMessage(text);
  };

  const handleConfirm = async () => {
    if (inFlight.current || (!isReply && !openedMessage)) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await recordAssistedWhatsApp(queryClient, deal, {
        event: mode,
        message: isReply ? message.trim() : openedMessage ?? '',
        requestId: requestId.current,
        followUpTaskId: mode === 'follow_up_sent' ? followUpTaskId : undefined,
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao confirmar.');
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={isReply ? 'Marcar como respondeu'
        : mode === 'follow_up_sent' ? `Follow-up ${followUpNumber ?? 1} assistido` : 'Abrir WhatsApp'}>
      <div className="space-y-4 text-sm">
        <p className="font-medium text-slate-800 dark:text-white">{company}</p>
        {!isReply && (
          <>
            <label className="block">
              <span>Telefone</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)}
                disabled={openedMessage !== null}
                className="mt-1 w-full rounded-lg border p-2 text-slate-900" />
              {!validPhone && <span className="block mt-1 text-red-600">Informe um telefone válido com DDD.</span>}
            </label>
            <label className="block">
              <span>Mensagem</span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)}
                disabled={openedMessage !== null} rows={8}
                className="mt-1 w-full rounded-lg border p-2 text-slate-900" />
            </label>
          </>
        )}
        {isReply && (
          <label className="block">
            <span>Observação sobre a resposta (opcional)</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)}
              rows={3} className="mt-1 w-full rounded-lg border p-2 text-slate-900" />
          </label>
        )}
        {error && <p role="alert" className="text-red-600">{error}</p>}
        {!isReply && openedMessage === null && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void navigator.clipboard.writeText(message)}
              disabled={!message.trim()} className="rounded-lg border px-3 py-2">Copiar mensagem</button>
            <button type="button" onClick={handleOpen}
              disabled={!validPhone || !message.trim()} className="rounded-lg bg-green-600 px-3 py-2 text-white disabled:opacity-50">
              Abrir WhatsApp
            </button>
            <button type="button" onClick={onClose} className="rounded-lg border px-3 py-2">Cancelar</button>
          </div>
        )}
        {!isReply && openedMessage !== null && (
          <div className="space-y-2">
            <p className="font-semibold">Você enviou a mensagem?</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleConfirm()} disabled={busy}
                className="rounded-lg bg-green-600 px-3 py-2 text-white disabled:opacity-50">
                Sim, marcar como enviado
              </button>
              <button type="button" onClick={onClose} disabled={busy}
                className="rounded-lg border px-3 py-2">Ainda não</button>
            </div>
          </div>
        )}
        {isReply && (
          <div className="flex gap-2">
            <button type="button" onClick={() => void handleConfirm()} disabled={busy}
              className="rounded-lg bg-green-600 px-3 py-2 text-white disabled:opacity-50">
              Marcar como respondeu
            </button>
            <button type="button" onClick={onClose} disabled={busy}
              className="rounded-lg border px-3 py-2">Cancelar</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
