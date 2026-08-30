'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, MessageSquare } from 'lucide-react';
import { COMMERCIAL_MESSAGE_TEMPLATES } from '../data/commercialMessageTemplates';

export function DealCommercialMessages() {
  const [selectedId, setSelectedId] = useState(COMMERCIAL_MESSAGE_TEMPLATES[0]?.id ?? '');
  const selectedTemplate = COMMERCIAL_MESSAGE_TEMPLATES.find((template) => template.id === selectedId) ?? COMMERCIAL_MESSAGE_TEMPLATES[0];
  const [message, setMessage] = useState(selectedTemplate?.text ?? '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMessage(selectedTemplate?.text ?? '');
    setCopied(false);
  }, [selectedTemplate?.id]);

  const copyMessage = async () => {
    if (!message.trim()) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="commercial-messages-title">
      <div>
        <h3 id="commercial-messages-title" className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <MessageSquare size={16} className="text-primary-500" aria-hidden="true" /> Mensagens Comerciais
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Edite o texto antes de copiar. Nada será enviado ou salvo.</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="commercial-message-template" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Template</label>
        <select id="commercial-message-template" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-black/20 dark:text-white">
          {COMMERCIAL_MESSAGE_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="commercial-message-content" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Mensagem editável</label>
        <textarea id="commercial-message-content" value={message} onChange={(event) => { setMessage(event.target.value); setCopied(false); }} aria-label="Mensagem comercial editável" className="min-h-[280px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-black/20 dark:text-white" />
      </div>
      <button type="button" onClick={() => void copyMessage()} disabled={!message.trim()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:cursor-not-allowed disabled:opacity-50" aria-label={copied ? 'Mensagem copiada' : 'Copiar mensagem comercial'}>
        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} {copied ? 'Copiado' : 'Copiar'}
      </button>
    </section>
  );
}
