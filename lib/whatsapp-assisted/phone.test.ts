import { describe, expect, it } from 'vitest';
import { validatedWhatsAppPhone, whatsAppUrl } from './phone';
import { assistedMessage, fillSenderName, senderDisplayName } from './message';

describe('WhatsApp assistido: telefone e texto', () => {
  it('aceita número brasileiro válido, com máscara ou +55', () => {
    expect(validatedWhatsAppPhone('(11) 99999-0000')).toBe('5511999990000');
    expect(validatedWhatsAppPhone('+55 (11) 99999-0000')).toBe('5511999990000');
    expect(validatedWhatsAppPhone('11999990000')).toBe('5511999990000');
  });

  it('rejeita valores incompletos ou duvidosos', () => {
    expect(validatedWhatsAppPhone('11 9999')).toBeNull();
    expect(validatedWhatsAppPhone('+55 11')).toBeNull();
    expect(validatedWhatsAppPhone('abc')).toBeNull();
    expect(validatedWhatsAppPhone('')).toBeNull();
  });

  it('codifica caracteres especiais e preserva quebras de linha no link', () => {
    const message = 'Olá, Ana!\nA&B + proposta?';
    const url = whatsAppUrl('5511999990000', message);
    expect(url).toBe('https://wa.me/5511999990000?text=' + encodeURIComponent(message));
    expect(new URL(url).searchParams.get('text')).toBe(message);
  });

  it('prioriza a mensagem do deal e usa o template como fallback', () => {
    expect(assistedMessage('initial_sent', { mensagemInicial: 'Oi [Nome] da [Empresa]!' }, 'Ana', 'Acme'))
      .toBe('Oi Ana da Acme!');
    expect(assistedMessage('initial_sent', { mensagemInicial: '  ' }, 'Ana', 'Acme'))
      .toContain('Olá, Ana.');
    expect(assistedMessage('follow_up_sent', { mensagemInicial: 'ignorar' }, 'Ana', 'Acme'))
      .toContain('retomar minha mensagem anterior');
  });

  it('nunca mostra marcador sem valor: remove a frase em vez de inventar conteúdo', () => {
    const followUp1 = assistedMessage('follow_up_sent', {}, 'Ana', 'Acme', 1);
    expect(followUp1).toBe('Oi, Ana. Passando só para retomar minha mensagem anterior.\n\n'
      + 'Se fizer sentido, te mostro rapidamente como eu estruturaria isso. São 10 minutos mesmo.');
    const followUp2 = assistedMessage('follow_up_sent', {}, 'Ana', 'Acme', 2);
    expect(followUp2).toContain('Vou encerrar por aqui');
    const fallback = assistedMessage('initial_sent', {}, 'Ana', 'Acme');
    for (const text of [followUp1, followUp2, fallback]) {
      expect(text).not.toMatch(/\[[^\]]+\]/);
      expect(text).not.toMatch(/\n{3,}/);
    }
  });

  it('sem nome de contato, a saudação perde o nome em vez de usar um genérico', () => {
    expect(assistedMessage('follow_up_sent', {}, '', 'Acme', 1)).toMatch(/^Oi\. Passando/);
  });

  it('mensagem do Prospector mantém o texto; só o marcador [seu nome] é trocado', () => {
    const prospector = 'Oi! Vi o [algo] de vocês.\nAqui é [seu nome], da HGA.';
    expect(assistedMessage('initial_sent', { mensagemInicial: prospector }, 'Ana', 'Acme', 1, 'Humberto Arruda'))
      .toBe('Oi! Vi o [algo] de vocês.\nAqui é Humberto Arruda, da HGA.');
  });

  it('contato criado pelo fluxo tem o telefone como nome: a saudação não usa o número', () => {
    expect(assistedMessage('follow_up_sent', {}, '+5511999990000', 'Acme', 1)).toMatch(/^Oi\. Passando/);
  });
});

describe('WhatsApp assistido: [seu nome]', () => {
  it.each(['[seu nome]', '[Seu Nome]', '[Seu nome]', '[SEU NOME]', '[ seu  nome ]'])(
    'troca %s pelo nome do usuário logado', (marker) => {
      expect(fillSenderName(`Abraço,\n${marker}`, 'Humberto')).toBe('Abraço,\nHumberto');
    });

  it('sem nome no perfil, remove o marcador sem deixar linha vazia ou pontuação solta', () => {
    expect(fillSenderName('Olá!\n\nAbraço,\n[Seu Nome]', '')).toBe('Olá!\n\nAbraço,');
    expect(fillSenderName('Aqui é [seu nome], da HGA Systems.', '')).toBe('Aqui é da HGA Systems.');
    expect(fillSenderName('Abraço, [SEU NOME]', '')).toBe('Abraço');
  });

  it('nunca deixa o marcador literal e não mexe no resto do texto', () => {
    const text = 'Linha 1\n  recuo mantido  \n[seu nome] e [Seu Nome]';
    for (const name of ['Ana', '']) {
      const result = fillSenderName(text, name);
      expect(result).not.toMatch(/seu\s+nome/i);
      expect(result.startsWith('Linha 1\n  recuo mantido  \n')).toBe(true);
    }
  });

  it('usa nome e sobrenome do perfil, depois o apelido; nunca o e-mail', () => {
    expect(senderDisplayName({ first_name: 'Humberto', last_name: 'Arruda', nickname: 'Beto' })).toBe('Humberto Arruda');
    expect(senderDisplayName({ first_name: ' ', nickname: 'Beto' })).toBe('Beto');
    expect(senderDisplayName({ first_name: null, last_name: null, nickname: null })).toBe('');
    expect(senderDisplayName(null)).toBe('');
  });
});
