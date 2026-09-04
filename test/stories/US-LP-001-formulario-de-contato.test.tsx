import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ContactForm } from '@/components/landing/ContactForm'

// Story: US-LP-001 — Formulário de contato da landing
//
// O critério para cada caso aqui é: o que quebra EM SILÊNCIO. Um defeito
// neste formulário não aparece na tela — o lead simplesmente não chega, e
// isso só é descoberto semanas depois pela ausência de contatos.
//
// O formulário é autossuficiente (não usa Supabase, auth nem TanStack Query),
// então basta mockar o fetch.

type FetchMock = ReturnType<typeof vi.fn>

function jsonResponse(status: number, body: unknown = { ok: true, message: 'Recebido.' }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

/** Lê o header Idempotency-Key da n-ésima chamada ao fetch. */
function idempotencyKeyOf(fetchMock: FetchMock, call = 0) {
  const init = fetchMock.mock.calls[call][1] as RequestInit
  return (init.headers as Record<string, string>)['Idempotency-Key']
}

function bodyOf(fetchMock: FetchMock, call = 0) {
  const init = fetchMock.mock.calls[call][1] as RequestInit
  return JSON.parse(init.body as string)
}

/**
 * O `clear()` antes do `type()` não é zelo: é obrigatório aqui.
 *
 * O userEvent mantém um cache interno do valor de cada campo. O `form.reset()`
 * do componente altera o DOM por fora desse cache, então numa segunda digitação
 * o userEvent reconstrói a partir do valor antigo e produz "MarinaMarina" — e
 * o e-mail duplicado deixa o formulário inválido, com o botão travado e o teste
 * falhando por um motivo que não existe no navegador. O `clear()` ressincroniza.
 */
async function typeInto(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  text: string
) {
  const field = screen.getByLabelText(label)
  await user.clear(field)
  await user.type(field, text)
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await typeInto(user, 'Nome', 'Marina')
  await typeInto(user, 'Empresa', 'Bandeirantes Log')
  await typeInto(user, 'E-mail', 'marina@bandeirantes.com.br')
  await user.click(screen.getByLabelText('Automação de processos'))
  await typeInto(
    user,
    'O que está acontecendo hoje',
    'Os pedidos chegam por WhatsApp e alguém relança tudo no ERP na mão.'
  )
}

function submitButton() {
  return screen.getByRole('button', { name: /Falar sobre o meu caso|Enviando/ })
}

describe('US-LP-001 — Formulário de contato da landing', () => {
  let fetchMock: FetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('envia o contato com todos os campos que o servidor espera', async () => {
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(jsonResponse(201))

    render(<ContactForm />)
    await fillForm(user)
    await user.click(submitButton())

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/public/landing-contact')
    expect((init as RequestInit).method).toBe('POST')

    // Renomear qualquer um destes sem mexer no servidor é um erro mudo:
    // a requisição continua 2xx e o dado chega vazio do outro lado.
    const body = bodyOf(fetchMock)
    expect(body).toMatchObject({
      nome: 'Marina',
      empresa: 'Bandeirantes Log',
      email: 'marina@bandeirantes.com.br',
      assunto: 'automacao',
      mensagem: 'Os pedidos chegam por WhatsApp e alguém relança tudo no ERP na mão.',
    })
    expect(body).toHaveProperty('source_page')

    // O honeypot precisa ir junto: é por ele que o servidor descarta bot.
    expect(body).toHaveProperty('honeypot')
  })

  it('renova a chave de idempotência depois de um envio concluído', async () => {
    // Este é o caso mais caro do arquivo. Se a chave for reaproveitada, o
    // SEGUNDO contato do mesmo visitante chega ao servidor com a chave do
    // primeiro, é tratado como duplicata e descartado — enquanto a tela diz
    // "mensagem recebida". O lead evapora sem nenhum sinal.
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(jsonResponse(201))

    render(<ContactForm />)
    await fillForm(user)
    await user.click(submitButton())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    await fillForm(user)
    await user.click(submitButton())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    expect(idempotencyKeyOf(fetchMock, 0)).toBeTruthy()
    expect(idempotencyKeyOf(fetchMock, 1)).not.toBe(idempotencyKeyOf(fetchMock, 0))
  })

  it('reaproveita a chave quando a tentativa anterior falhou', async () => {
    // O outro lado da moeda: se a chave mudasse a cada tentativa, uma
    // submissão que já entrou no servidor viraria duplicata ao ser reenviada.
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(jsonResponse(500, { error: 'boom' }))

    render(<ContactForm />)
    await fillForm(user)
    await user.click(submitButton())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    await user.click(submitButton())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    expect(idempotencyKeyOf(fetchMock, 1)).toBe(idempotencyKeyOf(fetchMock, 0))
  })

  it('trata 202 como recebido: limpa o formulário e pede chave nova na próxima', async () => {
    // 201 (gravado) e 202 (ainda processando) significam a mesma coisa para o
    // visitante. O 202 não pode deixar os campos preenchidos, senão a pessoa
    // lê "recebemos sua mensagem" com o texto ainda na tela e reenvia.
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(jsonResponse(202))

    render(<ContactForm />)
    await fillForm(user)
    await user.click(submitButton())

    await screen.findByText('Recebemos sua mensagem e estamos processando o contato.')
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('')
    expect(submitButton()).toHaveProperty('disabled', true)

    await fillForm(user)
    await user.click(submitButton())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(idempotencyKeyOf(fetchMock, 1)).not.toBe(idempotencyKeyOf(fetchMock, 0))
  })

  it.each([
    [422, 'Confira os dados preenchidos e tente novamente.'],
    [409, 'Esta solicitação ainda está sendo processada. Aguarde um instante e tente novamente.'],
    [429, 'Recebemos muitas tentativas recentes. Aguarde alguns minutos e tente novamente.'],
  ])('no erro %i mostra a mensagem certa e preserva o que foi digitado', async (status, message) => {
    // A mensagem de erro promete que os dados continuam preenchidos. Se um
    // refactor limpar o formulário aqui, a promessa quebra e a pessoa vai embora.
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(jsonResponse(status, { error: 'nope' }))

    render(<ContactForm />)
    await fillForm(user)
    await user.click(submitButton())

    await screen.findByText(message)
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Marina')
  })

  it('na falha de rede avisa e mantém os dados na tela', async () => {
    const user = userEvent.setup()
    fetchMock.mockRejectedValue(new Error('offline'))

    render(<ContactForm />)
    await fillForm(user)
    await user.click(submitButton())

    await screen.findByText(
      'Não foi possível concluir agora. Seus dados continuam preenchidos; tente novamente em instantes.'
    )
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Marina')
  })

  it('só habilita o envio com o formulário válido', async () => {
    // Enquanto obrigatório estiver faltando, o botão fica travado — é o que
    // impede uma submissão pela metade chegar ao servidor e ser rejeitada.
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(jsonResponse(201))

    render(<ContactForm />)
    expect(submitButton()).toHaveProperty('disabled', true)

    await user.type(screen.getByLabelText('Nome'), 'Marina')
    expect(submitButton()).toHaveProperty('disabled', true)

    await fillForm(user)
    expect(submitButton()).toHaveProperty('disabled', false)
  })
})
