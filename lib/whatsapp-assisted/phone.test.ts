import { describe, expect, it } from 'vitest';
import { validatedWhatsAppPhone, whatsAppUrl } from './phone';
import { assistedMessage } from './message';

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

  it('mensagem do Prospector é mostrada como veio, para o usuário revisar', () => {
    expect(assistedMessage('initial_sent', { mensagemInicial: 'Oi! Aqui é [seu nome].' }, 'Ana', 'Acme'))
      .toBe('Oi! Aqui é [seu nome].');
  });
});
