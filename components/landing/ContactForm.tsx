'use client'

import { FormEvent, useRef, useState } from 'react'

const subjectOptions = [
  { value: 'crm', label: 'CRM e gestão comercial' },
  { value: 'automacao', label: 'Automação de processos' },
  { value: 'diagnostico', label: 'Diagnóstico da operação' },
  { value: 'outro', label: 'Outro assunto' },
] as const

type FormState = 'idle' | 'submitting' | 'accepted' | 'success' | 'error'

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return [...bytes].map((byte, index) => [4, 6, 8, 10].includes(index) ? `-${byte.toString(16).padStart(2, '0')}` : byte.toString(16).padStart(2, '0')).join('')
}

function messageForStatus(status: number) {
  if (status === 400 || status === 422) return 'Confira os dados preenchidos e tente novamente.'
  if (status === 409) return 'Esta solicitação ainda está sendo processada. Aguarde um instante e tente novamente.'
  if (status === 429) return 'Recebemos muitas tentativas recentes. Aguarde alguns minutos e tente novamente.'
  return 'Não foi possível concluir agora. Seus dados continuam preenchidos; tente novamente em instantes.'
}

export function ContactForm() {
  const [state, setState] = useState<FormState>('idle')
  const [message, setMessage] = useState('')
  const idempotencyKey = useRef<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'submitting') return
    const form = event.currentTarget
    const data = new FormData(form)
    idempotencyKey.current ??= newIdempotencyKey()
    setState('submitting')
    setMessage('')

    try {
      const response = await fetch('/api/public/landing-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey.current },
        body: JSON.stringify({
          nome: data.get('nome'), empresa: data.get('empresa'), email: data.get('email'),
          whatsapp: data.get('whatsapp'), assunto: data.get('assunto'), mensagem: data.get('mensagem'),
          source_page: window.location.pathname || '/', honeypot: data.get('website'),
        }),
      })

      if (response.status === 202) {
        setState('accepted')
        setMessage('Recebemos sua mensagem e estamos processando o contato.')
        return
      }
      if (response.ok) {
        setState('success')
        setMessage('Mensagem recebida. Em breve entraremos em contato.')
        form.reset()
        idempotencyKey.current = null
        return
      }
      setState('error')
      setMessage(messageForStatus(response.status))
    } catch {
      setState('error')
      setMessage('Não foi possível concluir agora. Seus dados continuam preenchidos; tente novamente em instantes.')
    }
  }

  return (
    <form className="hga-form" onSubmit={handleSubmit}>
      <div className="hga-form-row">
        <label>Nome<input name="nome" autoComplete="name" placeholder="Seu nome" required maxLength={120} /></label>
        <label>Empresa<input name="empresa" autoComplete="organization" placeholder="Nome da empresa" maxLength={160} /></label>
      </div>
      <div className="hga-form-row">
        <label>E-mail<input type="email" name="email" autoComplete="email" placeholder="voce@empresa.com" required maxLength={254} /></label>
        <label>WhatsApp<input type="tel" name="whatsapp" autoComplete="tel" placeholder="(00) 00000-0000" maxLength={40} /></label>
      </div>
      <fieldset className="hga-form-field">
        <legend>Assunto</legend>
        <div className="hga-chips">
          {subjectOptions.map((option, index) => (
            <span key={option.value}>
              <input className="hga-chip-input" type="radio" name="assunto" id={`sol-${option.value}`} value={option.value} required={index === 0} />
              <label className="hga-chip" htmlFor={`sol-${option.value}`}>{option.label}</label>
            </span>
          ))}
        </div>
      </fieldset>
      <label className="hga-form-field">
        O que está acontecendo hoje
        <textarea name="mensagem" rows={4} maxLength={5000} placeholder="Ex.: os pedidos chegam por WhatsApp e alguém relança tudo no ERP na mão." required />
      </label>
      <label className="hga-honeypot" aria-hidden="true">Site<input name="website" tabIndex={-1} autoComplete="off" maxLength={200} /></label>
      <button className="hga-submit" type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Enviando…' : 'Falar sobre o meu caso'}
      </button>
      <p className="hga-form-note">Os dados são usados só para responder este contato, seguindo boas práticas de privacidade e a LGPD.</p>
      <p className="hga-form-status" role="status" aria-live="polite">{message}</p>
    </form>
  )
}
