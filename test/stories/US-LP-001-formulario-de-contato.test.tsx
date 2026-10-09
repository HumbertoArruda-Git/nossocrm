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
  label: RegExp,
  text: string
) {
  const field = screen.getByLabelText(label)
  await user.clear(field)
  await user.type(field, text)
}

// Os rótulos carregam marcação de obrigatório/opcional, então a busca é por
// prefixo: o teste não deve travar a redação do rótulo, só a identidade do campo.
const nomeField = /^Nome/
const empresaField = /^Empresa/
const emailField = /^E-mail/
const mensagemField = /^O que está acontecendo hoje/

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await typeInto(user, nomeField, 'Marina')
  await typeInto(user, empresaField, 'Bandeirantes Log')
  await typeInto(user, emailField, 'marina@bandeirantes.com.br')
  await user.click(screen.getByLabelText('Automação de processos'))
  await typeInto(
    user,
    mensagemField,
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
    expect((screen.getByLabelText(nomeField) as HTMLInputElement).value).toBe('')
    // O formulário limpo não pode anunciar "falta preencher" junto com a
    // confirmação: a pessoa leria que o envio deu errado.
    expect(screen.queryByText(/Falta preencher:/)).toBeNull()

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
    expect((screen.getByLabelText(nomeField) as HTMLInputElement).value).toBe('Marina')
  })

  it('no 409 de chave reusada pede novo envio e troca a chave', async () => {
    // Os dois 409 do servidor pedem coisas opostas. Quando o visitante edita a
    // mensagem depois de uma falha, esperar não resolve nunca: a chave antiga
    // descreve outro conteúdo e o servidor vai recusar para sempre. A tela
    // precisa dizer "envie de novo" — e o próximo envio precisa de chave nova.
    const user = userEvent.setup()
    fetchMock.mockResolvedValueOnce(jsonResponse(409, { ok: false, code: 'IDEMPOTENCY_KEY_REUSED' }))
    fetchMock.mockResolvedValue(jsonResponse(201))

    render(<ContactForm />)
    await fillForm(user)
    await user.click(submitButton())

    await screen.findByText(
      'Você alterou os dados depois da tentativa anterior. Envie novamente para registrar a nova versão.'
    )
    expect((screen.getByLabelText(nomeField) as HTMLInputElement).value).toBe('Marina')

    await user.click(submitButton())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(idempotencyKeyOf(fetchMock, 1)).not.toBe(idempotencyKeyOf(fetchMock, 0))
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
    expect((screen.getByLabelText(nomeField) as HTMLInputElement).value).toBe('Marina')
  })

  it('mantém o botão de envio alcançável e não envia formulário incompleto', async () => {
    // Botão desabilitado sai da ordem do Tab: quem usa teclado ou leitor de
    // tela nem encontra a ação. O botão fica sempre ativo; quem barra a
    // submissão pela metade é a validação no clique.
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(jsonResponse(201))

    render(<ContactForm />)
    expect(submitButton()).toHaveProperty('disabled', false)

    await user.type(screen.getByLabelText(nomeField), 'Marina')
    await user.click(submitButton())
    expect(fetchMock).not.toHaveBeenCalled()

    await fillForm(user)
    await user.click(submitButton())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
  })

  it('no envio incompleto aponta cada campo e leva o foco ao primeiro', async () => {
    const user = userEvent.setup()
    render(<ContactForm />)

    await typeInto(user, emailField, 'marina@bandeirantes.com.br')
    await user.click(submitButton())

    expect(screen.getByText('Informe seu nome.')).toBeTruthy()
    expect(screen.getByText('Escolha um assunto.')).toBeTruthy()
    expect(screen.getByText('Conte o que está acontecendo hoje.')).toBeTruthy()
    expect(screen.getByText(/Falta preencher: Nome, Assunto, O que está acontecendo hoje/)).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByLabelText(nomeField))
  })

  it('aplica os mesmos mínimos do servidor, em vez de liberar um 422', async () => {
    // O navegador aceitava nome "A" e mensagem "Oi": o botão acendia, o envio
    // saía e voltava 422 com "confira os dados" — sem dizer qual dado.
    const user = userEvent.setup()
    fetchMock.mockResolvedValue(jsonResponse(201))

    render(<ContactForm />)
    await typeInto(user, nomeField, 'A')
    await typeInto(user, emailField, 'marina@bandeirantes.com.br')
    await user.click(screen.getByLabelText('Automação de processos'))
    await typeInto(user, mensagemField, 'Oi')
    await user.click(submitButton())
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText('Escreva o nome com pelo menos 2 caracteres.')).toBeTruthy()

    await typeInto(user, nomeField, 'Marina')
    await typeInto(user, mensagemField, 'Perdemos pedidos no WhatsApp.')
    await user.click(submitButton())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
  })

  it('diz qual campo está errado, e não só que algo está', async () => {
    // Sem identificação por campo o visitante fica adivinhando — e um botão
    // desativado sem explicação não dá nem como perguntar.
    const user = userEvent.setup()
    render(<ContactForm />)

    // Antes de qualquer tentativa de envio não há bronca na tela.
    expect(screen.queryByText(/Falta preencher:/)).toBeNull()

    await typeInto(user, emailField, 'marina@')
    await user.tab()

    await screen.findByText('Confira o e-mail: ele parece incompleto.')
    expect((screen.getByLabelText(emailField) as HTMLInputElement).getAttribute('aria-invalid')).toBe('true')
  })

  it('oferece um assunto para cada solução, mais diagnóstico e outro', () => {
    render(<ContactForm />)
    for (const label of [
      'CRM e gestão comercial',
      'Automação de processos',
      'IA aplicada',
      'Integração de sistemas',
      'Dashboards e BI',
      'Sistema sob medida',
      'Ainda não sei: quero um diagnóstico',
      'Outro assunto',
    ]) {
      expect(screen.getByLabelText(label)).toBeTruthy()
    }
  })

  it('pré-seleciona o assunto vindo da página de solução', async () => {
    // O CTA da página de Integração leva para /?assunto=integracao#contato.
    // Sem isso, quem veio de lá chega no formulário e tem que achar de novo
    // o próprio assunto.
    window.history.replaceState(null, '', '/?assunto=integracao')
    try {
      render(<ContactForm />)
      await waitFor(() =>
        expect((screen.getByLabelText('Integração de sistemas') as HTMLInputElement).checked).toBe(true)
      )
    } finally {
      window.history.replaceState(null, '', '/')
    }
  })

  it('ignora assunto desconhecido na URL', () => {
    window.history.replaceState(null, '', '/?assunto=qualquer-coisa')
    try {
      render(<ContactForm />)
      const radios = screen.getAllByRole('radio') as HTMLInputElement[]
      expect(radios.some((radio) => radio.checked)).toBe(false)
    } finally {
      window.history.replaceState(null, '', '/')
    }
  })
})
