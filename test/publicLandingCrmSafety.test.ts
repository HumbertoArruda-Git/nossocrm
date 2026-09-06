import { describe, expect, it } from 'vitest';
import { processLandingCrm } from '@/lib/public-landing/crm';

/**
 * O formulário da landing é anônimo: quem envia não prova ser dono do e-mail
 * nem do telefone que digitou. Enquanto a busca por esses campos autorizava
 * escrita, bastava informar os dados de outra pessoa para reescrever o cadastro
 * dela e a oportunidade aberta do time em cima dela.
 *
 * Estes testes fixam a regra: encontrar é permitido, sobrescrever não é.
 */

type Row = Record<string, unknown> | null;

function fakeDb(rows: { company?: Row; contact?: Row; deal?: Row; activity?: Row }) {
  const writes: { table: string; operation: 'insert' | 'update'; value: Record<string, unknown> }[] = [];

  const db = {
    from(table: string) {
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      Object.assign(builder, {
        select: chain, eq: chain, is: chain, ilike: chain, or: chain, order: chain, limit: chain,
        insert(value: Record<string, unknown>) {
          builder.operation = 'insert';
          writes.push({ table, operation: 'insert', value });
          return builder;
        },
        update(value: Record<string, unknown>) {
          builder.operation = 'update';
          writes.push({ table, operation: 'update', value });
          return builder;
        },
        maybeSingle: async () => {
          if (builder.operation) return { data: { id: `${table}-written` }, error: null };
          if (table === 'crm_companies') return { data: rows.company ?? null, error: null };
          if (table === 'contacts') return { data: rows.contact ?? null, error: null };
          if (table === 'deals') return { data: rows.deal ?? null, error: null };
          if (table === 'activities') return { data: rows.activity ?? null, error: null };
          return { data: null, error: null };
        },
        single: async () => ({ data: { id: `${table}-written` }, error: null }),
      });
      return builder;
    },
  };

  return { db: db as never, writes };
}

const input = {
  organizationId: 'org-1',
  boardId: 'board-1',
  stageId: 'stage-1',
  submissionId: 'submission-1',
  contactId: null,
  dealId: null,
  activityId: null,
  name: 'Impostor',
  email: 'vitima@empresa.com.br',
  phone: '+5511999999999',
  companyName: 'Empresa Falsa',
  subject: 'crm' as const,
  message: 'Mensagem enviada por terceiro.',
};

describe('landing CRM — escrita em registros existentes', () => {
  it('não reescreve nome, empresa nem origem de um contato que já existe', async () => {
    const { db, writes } = fakeDb({
      company: { id: 'company-falsa' },
      contact: {
        id: 'contact-1', name: 'Cliente Real', email: 'vitima@empresa.com.br',
        phone: '+5511888888888', client_company_id: 'company-real', source: 'INDICACAO',
      },
      deal: { id: 'deal-1' },
    });

    const result = await processLandingCrm(db, input);

    expect(result.contactId).toBe('contact-1');
    const contactWrites = writes.filter((write) => write.table === 'contacts');
    expect(contactWrites).toHaveLength(0);
  });

  it('preenche apenas os campos que estavam vazios', async () => {
    const { db, writes } = fakeDb({
      company: { id: 'company-1' },
      contact: { id: 'contact-1', name: 'Sem nome', email: 'vitima@empresa.com.br', phone: null, client_company_id: null, source: null },
      deal: { id: 'deal-1' },
    });

    await processLandingCrm(db, input);

    const update = writes.find((write) => write.table === 'contacts' && write.operation === 'update');
    expect(update?.value).toEqual({
      name: 'Impostor',
      phone: '+5511999999999',
      client_company_id: 'company-1',
      source: 'WEBSITE',
    });
  });

  it('não toca em título, empresa ou etiquetas de uma oportunidade aberta', async () => {
    const { db, writes } = fakeDb({
      contact: { id: 'contact-1', name: 'Cliente Real', email: 'vitima@empresa.com.br', phone: '+5511888888888', client_company_id: 'company-real', source: 'INDICACAO' },
      deal: { id: 'deal-1' },
    });

    const result = await processLandingCrm(db, input);

    expect(result.dealId).toBe('deal-1');
    expect(writes.filter((write) => write.table === 'deals')).toHaveLength(0);
  });

  it('a mensagem vira registro separado, e é lá que o conteúdo do visitante entra', async () => {
    const { db, writes } = fakeDb({
      contact: { id: 'contact-1', name: 'Cliente Real', email: 'vitima@empresa.com.br', phone: '+5511888888888', client_company_id: 'company-real', source: 'INDICACAO' },
      deal: { id: 'deal-1' },
      activity: null,
    });

    await processLandingCrm(db, input);

    const activity = writes.find((write) => write.table === 'activities' && write.operation === 'insert');
    expect(activity?.value).toMatchObject({
      description: 'Mensagem enviada por terceiro.',
      deal_id: 'deal-1',
      contact_id: 'contact-1',
      type: 'NOTE',
    });
  });

  it('um contato inédito continua sendo criado com tudo o que veio do formulário', async () => {
    const { db, writes } = fakeDb({ contact: null, deal: null });

    await processLandingCrm(db, input);

    const contact = writes.find((write) => write.table === 'contacts' && write.operation === 'insert');
    expect(contact?.value).toMatchObject({ name: 'Impostor', email: 'vitima@empresa.com.br', source: 'WEBSITE' });
    const deal = writes.find((write) => write.table === 'deals' && write.operation === 'insert');
    expect(deal?.value).toMatchObject({ title: 'Lead — Impostor', tags: ['Landing HGA', 'Landing: crm'] });
  });
});
