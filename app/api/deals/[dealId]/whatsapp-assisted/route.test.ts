import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  user: { id: 'user-1' } as { id: string } | null,
  rows: {} as Record<string, unknown>,
  filters: [] as { table: string; column: string; value: unknown }[],
  rpc: vi.fn(),
}));

vi.mock('@/lib/security/sameOrigin', () => ({ isAllowedOrigin: () => true }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    from: (table: string) => {
      const chain = {
        select: () => chain,
        eq: (column: string, value: unknown) => { state.filters.push({ table, column, value }); return chain; },
        is: () => chain,
        maybeSingle: async () => ({ data: state.rows[table] ?? null, error: null }),
      };
      return chain;
    },
    rpc: state.rpc,
  }),
}));

import { POST } from './route';

const DEAL_ID = '00000000-0000-4000-8000-000000000131';
const REQUEST_ID = '00000000-0000-4000-8000-000000000141';

function post(body: unknown) {
  return POST(
    new NextRequest(`http://localhost/api/deals/${DEAL_ID}/whatsapp-assisted`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    { params: Promise.resolve({ dealId: DEAL_ID }) }
  );
}

describe('POST /api/deals/[dealId]/whatsapp-assisted', () => {
  beforeEach(() => {
    state.user = { id: 'user-1' };
    state.filters = [];
    state.rows = {
      profiles: { organization_id: 'org-1' },
      deals: { id: DEAL_ID, organization_id: 'org-1', contact_id: 'contact-1', board_id: 'board-1' },
      contacts: { id: 'contact-1' },
      boards: { key: 'prospeccao-comercial' },
    };
    state.rpc.mockReset().mockResolvedValue({ data: { stage_id: 'stage-2', duplicate: false }, error: null });
  });

  it('recusa sem login', async () => {
    state.user = null;
    expect((await post({ event: 'initial_sent', message: 'Oi', requestId: REQUEST_ID })).status).toBe(401);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('recusa follow-up sem TASK e mensagem vazia', async () => {
    expect((await post({ event: 'follow_up_sent', message: 'Oi', requestId: REQUEST_ID })).status).toBe(400);
    expect((await post({ event: 'initial_sent', message: '  ', requestId: REQUEST_ID })).status).toBe(400);
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('deal de outra organização vira 404, sem lançar e sem chamar a RPC', async () => {
    state.rows.deals = null;
    expect((await post({ event: 'initial_sent', message: 'Oi', requestId: REQUEST_ID })).status).toBe(404);
    expect(state.filters).toContainEqual({ table: 'deals', column: 'organization_id', value: 'org-1' });
    expect(state.rpc).not.toHaveBeenCalled();
  });

  it('só aceita o board de prospecção comercial', async () => {
    state.rows.boards = { key: 'vendas' };
    expect((await post({ event: 'initial_sent', message: 'Oi', requestId: REQUEST_ID })).status).toBe(404);
  });

  it('repassa a confirmação para a RPC', async () => {
    const response = await post({ event: 'replied', message: '', requestId: REQUEST_ID });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ stage_id: 'stage-2', duplicate: false });
    expect(state.rpc).toHaveBeenCalledWith('record_assisted_whatsapp', {
      p_deal_id: DEAL_ID,
      p_event: 'replied',
      p_message: '',
      p_request_id: REQUEST_ID,
      p_follow_up_task_id: null,
    });
  });

  it('erro da RPC (ex.: sequência encerrada) vira 409', async () => {
    state.rpc.mockResolvedValue({ data: null, error: { code: 'P0001' } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await post({ event: 'initial_sent', message: 'Oi', requestId: REQUEST_ID })).status).toBe(409);
  });
});
