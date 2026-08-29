import { describe, expect, it } from 'vitest';
import { generateCustomFieldKey } from './customFieldKey';

describe('generateCustomFieldKey', () => {
  it.each([
    ['Prioridade de Prospecção', 'prioridadeDeProspeccao'],
    ['Oportunidade Observável', 'oportunidadeObservavel'],
    ['Ação Comercial Recomendada', 'acaoComercialRecomendada'],
    ['Serviço Recomendado', 'servicoRecomendado'],
    ['Evidência Principal', 'evidenciaPrincipal'],
    ['Próximo Passo Sugerido', 'proximoPassoSugerido'],
    ['Place ID', 'placeId'],
    ['Teste Supabase', 'testeSupabase'],
  ])('%s → %s', (label, expected) => expect(generateCustomFieldKey(label)).toBe(expected));

  it('normalizes separators and protects numeric or invalid labels', () => {
    expect(generateCustomFieldKey('  Campo--de   teste!! ')).toBe('campoDeTeste');
    expect(generateCustomFieldKey('123 Campo')).toBe('field123Campo');
    expect(generateCustomFieldKey('---')).toBe('');
  });
});
