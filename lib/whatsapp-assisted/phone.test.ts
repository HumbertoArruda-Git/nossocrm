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
});
