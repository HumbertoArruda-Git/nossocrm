import { beforeEach, describe, expect, it, vi } from 'vitest';

const ORG = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5';
const OTHER_ORG = 'f1e2d3c4-b5a6-4987-8123-456789abcdef';
const BOARD = 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6';
const STAGE = 'c3d4e5f6-a7b8-4c9d-8e0f-a1b2c3d4e5f6';
const CONTACT = 'd4e5f6a7-b8c9-4d0e-8f1a-b2c3d4e5f6a7';
const COMPANY = 'a991ee62-4e96-42e4-98bc-2c10941451b5';
const DEAL = 'e5f6a7b8-c9d0-4e1f-8a2b-c3d4e5f6a7b8';

let scenario: {
  definitions?: Array<{ key: string; type: string; options: string[] | null; entity_type: string; organization_id: string }>;
  contact?: { id: string } | null;
  company?: { id: string } | null;
  deal?: Record<string, unknown> | null;
  list?: Array<Record<string, unknown>>;
  patch?: Record<string, unknown>;
  updatePayload?: Record<string, unknown>;
};

vi.mock('@/lib/public-api/auth', () => ({ authPublicApi: vi.fn() }));
vi.mock('@/lib/public-api/resolve', () => ({
  resolveBoardIdFromKey: vi.fn(async () => BOARD),
  resolveFirstStageId: vi.fn(async () => STAGE),
}));

function builder(table: string) {
  const q: Record<string, any> = {
    select: vi.fn(() => q), eq: vi.fn(() => q), is: vi.fn(() => q), order: vi.fn(() => q),
    range: vi.fn(async () => ({ data: scenario.list ?? [], count: scenario.list?.length ?? 0, error: null })),
    contains: vi.fn(() => q),
    in: vi.fn(() => q),
    insert: vi.fn((payload) => { scenario.updatePayload = payload; return q; }),
    update: vi.fn((payload) => { scenario.updatePayload = payload; return q; }),
    maybeSingle: vi.fn(async () => {
      if (table === 'contacts') return { data: scenario.contact ?? null, error: null };
      if (table === 'crm_companies') return { data: scenario.company ?? null, error: null };
      if (table === 'deals') return { data: scenario.deal ?? null, error: null };
      return { data: null, error: null };
    }),
    single: vi.fn(async () => {
      if (table === 'deals') return { data: scenario.deal ?? { id: DEAL, custom_fields: scenario.updatePayload?.custom_fields ?? {} }, error: null };
      if (table === 'contacts') return { data: { id: CONTACT }, error: null };
      return { data: null, error: null };
    }),
  };
  if (table === 'custom_field_definitions') q.in = vi.fn(async () => ({ data: scenario.definitions ?? [], error: null }));
  return q;
}

const supabase = { from: vi.fn((table: string) => builder(table)) };
vi.mock('@/lib/supabase/server', () => ({ createStaticAdminClient: vi.fn(() => supabase) }));

import { authPublicApi } from '@/lib/public-api/auth';
import { POST, GET as GET_LIST } from '@/app/api/public/v1/deals/route';
import { GET as GET_DEAL, PATCH } from '@/app/api/public/v1/deals/[dealId]/route';

const definitionSet = [
  { key: 'placeId', type: 'text', options: null, entity_type: 'deal', organization_id: ORG },
  { key: 'prioridadeDeProspeccao', type: 'number', options: null, entity_type: 'deal', organization_id: ORG },
  { key: 'status', type: 'select', options: ['Novo', 'Qualificado'], entity_type: 'deal', organization_id: ORG },
  { key: 'dataContato', type: 'date', options: null, entity_type: 'deal', organization_id: ORG },
];
const baseDeal = { id: DEAL, title: 'Deal', value: '0', board_id: BOARD, stage_id: STAGE, contact_id: CONTACT, client_company_id: COMPANY, is_won: false, is_lost: false, loss_reason: null, closed_at: null, created_at: '2026-01-01', updated_at: '2026-01-01', custom_fields: { placeId: 'ABC', prioridadeDeProspeccao: 85 } };
const request = (url: string, body?: unknown) => new Request(`http://localhost${url}`, body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

beforeEach(() => {
  scenario = { definitions: definitionSet, contact: { id: CONTACT }, company: { id: COMPANY }, deal: baseDeal, list: [baseDeal] };
  vi.clearAllMocks();
  vi.mocked(authPublicApi).mockResolvedValue({ ok: true, organizationId: ORG, organizationName: 'Org', apiKeyId: 'key', apiKeyPrefix: 'test_' });
});

describe('Public Deals API — custom fields', () => {
  it('cria com custom_fields válidos e também aceita POST sem custom_fields', async () => {
    const valid = await POST(request('/api/public/v1/deals', { title: 'D', board_key: 'sales', contact_id: CONTACT, custom_fields: { placeId: 'XYZ', prioridadeDeProspeccao: 85 } }));
    expect(valid.status).toBe(201);
    expect(scenario.updatePayload).toMatchObject({ custom_fields: { placeId: 'XYZ', prioridadeDeProspeccao: 85 } });
    scenario.updatePayload = undefined;
    expect((await POST(request('/api/public/v1/deals', { title: 'D', board_key: 'sales', contact_id: CONTACT }))).status).toBe(201);
  });

  it.each([
    [{ unknown: 'x' }, 'unknown'],
    [{ prioridadeDeProspeccao: '85' }, 'number'],
    [{ status: 'Inválido' }, 'select'],
    [{ dataContato: '2026-02-30' }, 'date'],
  ])('rejeita custom field inválido (%j)', async (fields) => {
    const response = await POST(request('/api/public/v1/deals', { title: 'D', board_key: 'sales', contact_id: CONTACT, custom_fields: fields }));
    expect(response.status).toBe(422);
  });

  it('isola definições por organization_id', async () => {
    scenario.definitions = definitionSet.map((d) => ({ ...d, organization_id: OTHER_ORG }));
    expect((await POST(request('/api/public/v1/deals', { title: 'D', board_key: 'sales', contact_id: CONTACT, custom_fields: { placeId: 'X' } }))).status).toBe(422);
    expect(supabase.from).toHaveBeenCalledWith('custom_field_definitions');
  });

  it('cria com contato, sem contato com empresa, e rejeita sem ambos', async () => {
    expect((await POST(request('/api/public/v1/deals', { title: 'D', board_key: 'sales', contact_id: CONTACT }))).status).toBe(201);
    scenario.contact = null;
    expect((await POST(request('/api/public/v1/deals', { title: 'D', board_key: 'sales', client_company_id: COMPANY }))).status).toBe(201);
    expect((await POST(request('/api/public/v1/deals', { title: 'D', board_key: 'sales' }))).status).toBe(422);
  });

  it('rejeita contato ou empresa inexistente/de outra organização', async () => {
    scenario.contact = null;
    expect((await POST(request('/api/public/v1/deals', { title: 'D', board_key: 'sales', contact_id: CONTACT }))).status).toBe(422);
    scenario.company = null;
    expect((await POST(request('/api/public/v1/deals', { title: 'D', board_key: 'sales', client_company_id: COMPANY }))).status).toBe(422);
  });

  it('GET list e GET por ID retornam valores e usam {} quando ausentes', async () => {
    expect((await (await GET_LIST(request('/api/public/v1/deals'))).json()).data[0].custom_fields).toEqual(baseDeal.custom_fields);
    expect((await (await GET_DEAL(request(`/api/public/v1/deals/${DEAL}`), { params: Promise.resolve({ dealId: DEAL }) })).json()).data.custom_fields).toEqual(baseDeal.custom_fields);
    scenario.list = [{ ...baseDeal, custom_fields: null }];
    expect((await (await GET_LIST(request('/api/public/v1/deals'))).json()).data[0].custom_fields).toEqual({});
  });

  it('filtra por placeId e retorna somente o Deal correspondente', async () => {
    const response = await GET_LIST(request('/api/public/v1/deals?custom_field_key=placeId&custom_field_value=ABC'));
    expect(response.status).toBe(200);
    const dealsCallIndex = vi.mocked(supabase.from).mock.calls.findIndex(([table]) => table === 'deals');
    expect(dealsCallIndex).toBeGreaterThanOrEqual(0);
    const dealsBuilder = vi.mocked(supabase.from).mock.results[dealsCallIndex].value;
    expect(dealsBuilder.contains).toHaveBeenCalledWith('custom_fields', { placeId: 'ABC' });
  });

  it('faz PATCH parcial preservando campos anteriores', async () => {
    scenario.deal = { ...baseDeal, custom_fields: { placeId: 'ABC', prioridadeDeProspeccao: 85 } };
    const response = await PATCH(request(`/api/public/v1/deals/${DEAL}`, { custom_fields: { prioridadeDeProspeccao: 95 } }), { params: Promise.resolve({ dealId: DEAL }) });
    expect(response.status).toBe(200);
    expect(scenario.updatePayload?.custom_fields).toEqual({ placeId: 'ABC', prioridadeDeProspeccao: 95 });
  });
});
