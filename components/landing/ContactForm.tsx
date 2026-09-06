'use client'

import { FormEvent, useRef, useState } from 'react'
import Link from 'next/link'

const subjectOptions = [
  { value: 'crm', label: 'CRM e gestão comercial' },
  { value: 'automacao', label: 'Automação de processos' },
  { value: 'diagnostico', label: 'Diagnóstico da operação' },
  { value: 'outro', label: 'Outro assunto' },
] as const

type FormState = 'idle' | 'submitting' | 'accepted' | 'success' | 'error'
type FieldName = 'nome' | 'email' | 'assunto' | 'mensagem'
type Errors = Partial<Record<FieldName, string>>

/** Rótulo curto de cada obrigatório, para a lista do que ainda falta. */
const requiredLabels: Record<FieldName, string> = {
  nome: 'Nome',
  email: 'E-mail',
  assunto: 'Assunto',
  mensagem: 'O que está acontecendo hoje',
}

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return [...bytes].map((byte, index) => [4, 6, 8, 10].includes(index) ? `-${byte.toString(16).padStart(2, '0')}` : byte.toString(16).padStart(2, '0')).join('')
}

/**
 * As regras aqui são as MESMAS do servidor (`lib/public-landing/validation.ts`),
 * inclusive o corte de espaços. Antes o navegador aceitava nome "A" e mensagem
 * "Oi", o botão ficava ativo, e o servidor devolvia 422 — o visitante levava um
 * "confira os dados" genérico sem saber qual campo estava errado.
 */
function validateValues(values: Record<FieldName, string>): Errors {
  const errors: Errors = {}

  const nome = values.nome.trim()
  if (!nome) errors.nome = 'Informe seu nome.'
  else if (nome.length < 2) errors.nome = 'Escreva o nome com pelo menos 2 caracteres.'

  const email = values.email.trim()
  if (!email) errors.email = 'Informe seu e-mail.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) errors.email = 'Confira o e-mail: ele parece incompleto.'

  if (!values.assunto) errors.assunto = 'Escolha um assunto.'

  const mensagem = values.mensagem.trim()
  if (!mensagem) errors.mensagem = 'Conte o que está acontecendo hoje.'
  else if (mensagem.length < 5) errors.mensagem = 'Escreva um pouco mais: pelo menos 5 caracteres.'

  return errors
}

function readValues(form: HTMLFormElement): Record<FieldName, string> {
  const data = new FormData(form)
  const get = (name: string) => String(data.get(name) ?? '')
  return { nome: get('nome'), email: get('email'), assunto: get('assunto'), mensagem: get('mensagem') }
}

function messageForResponse(status: number, code: string) {
  if (status === 400 || status === 422) return 'Confira os dados preenchidos e tente novamente.'
  // Os dois 409 do servidor querem coisas opostas do visitante: um pede espera,
  // o outro pede um novo envio. Tratá-los pela mesma mensagem mandava a pessoa
  // aguardar por um conflito que nenhuma espera resolve.
  if (code === 'IDEMPOTENCY_KEY_REUSED') return 'Você alterou os dados depois da tentativa anterior. Envie novamente para registrar a nova versão.'
  if (status === 409) return 'Esta solicitação ainda está sendo processada. Aguarde um instante e tente novamente.'
  if (status === 429) return 'Recebemos muitas tentativas recentes. Aguarde alguns minutos e tente novamente.'
  return 'Não foi possível concluir agora. Seus dados continuam preenchidos; tente novamente em instantes.'
}

export function ContactForm() {
  const [state, setState] = useState<FormState>('idle')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Errors>(() => validateValues({ nome: '', email: '', assunto: '', mensagem: '' }))
  const [touched, setTouched] = useState<FieldName[]>([])
  const idempotencyKey = useRef<string | null>(null)

  const isValid = Object.keys(errors).length === 0
  const missing = (Object.keys(requiredLabels) as FieldName[]).filter((field) => errors[field])
  const showError = (field: FieldName) => (touched.includes(field) ? errors[field] : undefined)

  function refresh(form: HTMLFormElement) {
    setErrors(validateValues(readValues(form)))
  }

  function markTouched(name: string) {
    if (!(name in requiredLabels)) return
    setTouched((current) => (current.includes(name as FieldName) ? current : [...current, name as FieldName]))
  }

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

      // 201 (gravado) e 202 (recebido, ainda processando) são a mesma coisa para
      // quem está do outro lado da tela: chegou. A distinção é encanamento, e
      // não há nada que a pessoa possa fazer com "ainda processando" — deixar o
      // formulário preenchido e o botão ativo só gerava dúvida e reenvio.
      // A mensagem continua sendo diferente porque ela é honesta sobre o estado.
      if (response.ok) {
        const stillProcessing = response.status === 202
        setState(stillProcessing ? 'accepted' : 'success')
        setMessage(
          stillProcessing
            ? 'Recebemos sua mensagem e estamos processando o contato.'
            : 'Mensagem recebida. Em breve entraremos em contato.'
        )
        form.reset()
        setTouched([])
        refresh(form)
        // A chave identifica ESTA submissão, que o servidor já tem. Uma próxima
        // mensagem é outra submissão e precisa de chave nova, senão o servidor
        // a descarta como duplicata e o contato se perde em silêncio.
        idempotencyKey.current = null
        return
      }

      const body = await response.json().catch(() => null)
      const code = String((body as { code?: unknown } | null)?.code ?? '')
      // A chave anterior descreve um conteúdo que não é mais este. Insistir com
      // ela devolveria 409 para sempre: o próximo envio precisa de chave nova.
      if (code === 'IDEMPOTENCY_KEY_REUSED') idempotencyKey.current = null
      setState('error')
      setMessage(messageForResponse(response.status, code))
    } catch {
      setState('error')
      setMessage('Não foi possível concluir agora. Seus dados continuam preenchidos; tente novamente em instantes.')
    }
  }

  return (
    <form
      className="hga-form"
      onSubmit={handleSubmit}
      onInput={(event) => refresh(event.currentTarget)}
      onBlur={(event) => markTouched((event.target as { name?: string }).name ?? '')}
      noValidate
    >
      <p className="hga-form-legend">Campos marcados com <span className="hga-req">*</span> são obrigatórios.</p>
      <div className="hga-form-row">
        <label>
          <span>Nome <span className="hga-req" aria-hidden="true">*</span></span>
          <input name="nome" autoComplete="name" placeholder="Seu nome" maxLength={120}
            aria-required="true" aria-invalid={showError('nome') ? true : undefined}
            aria-describedby={showError('nome') ? 'erro-nome' : undefined} />
          {showError('nome') && <span className="hga-field-error" id="erro-nome">{errors.nome}</span>}
        </label>
        <label>
          <span>Empresa <span className="hga-optional">(opcional)</span></span>
          <input name="empresa" autoComplete="organization" placeholder="Nome da empresa" maxLength={160} />
        </label>
      </div>
      <div className="hga-form-row">
        <label>
          <span>E-mail <span className="hga-req" aria-hidden="true">*</span></span>
          <input type="email" name="email" autoComplete="email" placeholder="voce@empresa.com" maxLength={254}
            aria-required="true" aria-invalid={showError('email') ? true : undefined}
            aria-describedby={showError('email') ? 'erro-email' : undefined} />
          {showError('email') && <span className="hga-field-error" id="erro-email">{errors.email}</span>}
        </label>
        <label>
          <span>WhatsApp <span className="hga-optional">(opcional)</span></span>
          <input type="tel" name="whatsapp" autoComplete="tel" placeholder="(00) 00000-0000" maxLength={40} />
        </label>
      </div>
      <fieldset className="hga-form-field" aria-describedby={showError('assunto') ? 'erro-assunto' : undefined}>
        <legend>Assunto <span className="hga-req" aria-hidden="true">*</span></legend>
        <div className="hga-chips">
          {subjectOptions.map((option) => (
            <span key={option.value}>
              <input className="hga-chip-input" type="radio" name="assunto" id={`sol-${option.value}`} value={option.value} />
              <label className="hga-chip" htmlFor={`sol-${option.value}`}>{option.label}</label>
            </span>
          ))}
        </div>
        {showError('assunto') && <span className="hga-field-error" id="erro-assunto">{errors.assunto}</span>}
      </fieldset>
      <label className="hga-form-field">
        <span>O que está acontecendo hoje <span className="hga-req" aria-hidden="true">*</span></span>
        <textarea name="mensagem" rows={4} maxLength={5000} placeholder="Ex.: os pedidos chegam por WhatsApp e alguém relança tudo no ERP na mão."
          aria-required="true" aria-invalid={showError('mensagem') ? true : undefined}
          aria-describedby={showError('mensagem') ? 'erro-mensagem' : undefined} />
        {showError('mensagem') && <span className="hga-field-error" id="erro-mensagem">{errors.mensagem}</span>}
      </label>
      <label className="hga-honeypot" aria-hidden="true">Site<input name="website" tabIndex={-1} autoComplete="off" maxLength={200} /></label>
      <button className={`hga-submit${isValid ? ' is-ready' : ''}`} type="submit" disabled={!isValid || state === 'submitting'}>
        {state === 'submitting' ? 'Enviando…' : 'Falar sobre o meu caso'}
      </button>
      {/* Um botão desativado sem explicação é um beco: a pessoa não consegue nem
          clicar para descobrir o que falta. Esta linha diz o que falta. */}
      {!isValid && (
        <p className="hga-form-hint" aria-live="polite">
          Falta preencher: {missing.map((field) => requiredLabels[field]).join(', ')}.
        </p>
      )}
      <p className="hga-form-note">
        Os dados são usados só para responder este contato, seguindo boas práticas de privacidade e a LGPD.{' '}
        <Link href="/privacidade">Como tratamos seus dados</Link>.
      </p>
      <p className="hga-form-status" role="status" aria-live="polite">{message}</p>
    </form>
  )
}
