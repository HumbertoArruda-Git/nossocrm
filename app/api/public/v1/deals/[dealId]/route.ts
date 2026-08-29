import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authPublicApi } from '@/lib/public-api/auth';
import { createStaticAdminClient } from '@/lib/supabase/server';
import { isValidUUID, sanitizeUUID } from '@/lib/supabase/utils';
import { normalizeText } from '@/lib/public-api/sanitize';
import { PublicCustomFieldsSchema, validateDealCustomFields } from '@/lib/public-api/customFields';

export const runtime = 'nodejs';

const DealPatchSchema = z.object({
  title: z.string().optional(),
  value: z.number().optional(),
  contact_id: z.string().uuid().optional(),
  client_company_id: z.string().uuid().nullable().optional(),
  loss_reason: z.string().nullable().optional(),
  custom_fields: PublicCustomFieldsSchema.optional(),
}).strict();

export async function GET(request: Request, ctx: { params: Promise<{ dealId: string }> }) {
  const auth = await authPublicApi(request);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const { dealId } = await ctx.params;
  if (!isValidUUID(dealId)) {
    return NextResponse.json({ error: 'Invalid deal id', code: 'VALIDATION_ERROR' }, { status: 422 });
  }

  const sb = createStaticAdminClient();
  const { data, error } = await sb
    .from('deals')
    .select('id,title,value,board_id,stage_id,contact_id,client_company_id,is_won,is_lost,loss_reason,closed_at,created_at,updated_at,custom_fields')
    .eq('organization_id', auth.organizationId)
    .is('deleted_at', null)
    .eq('id', dealId)
    .maybeSingle();

  if (error) {
    console.error('[API] Database error:', error)
    return NextResponse.json({ error: 'Internal server error', code: 'DB_ERROR' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Deal not found', code: 'NOT_FOUND' }, { status: 404 });

  return NextResponse.json({ data: { ...data, custom_fields: data.custom_fields ?? {} } });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ dealId: string }> }) {
  const auth = await authPublicApi(request);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });

  const { dealId } = await ctx.params;
  if (!isValidUUID(dealId)) {
    return NextResponse.json({ error: 'Invalid deal id', code: 'VALIDATION_ERROR' }, { status: 422 });
  }

  const body = await request.json().catch(() => null);
  const parsed = DealPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', code: 'VALIDATION_ERROR' }, { status: 422 });
  }

  const updates: any = {};
  if (parsed.data.title !== undefined) updates.title = normalizeText(parsed.data.title);
  if (parsed.data.value !== undefined) updates.value = Number(parsed.data.value ?? 0);
  if (parsed.data.contact_id !== undefined) updates.contact_id = sanitizeUUID(parsed.data.contact_id);
  if (parsed.data.client_company_id !== undefined) updates.client_company_id = parsed.data.client_company_id === null ? null : (sanitizeUUID(parsed.data.client_company_id) || null);
  if (parsed.data.loss_reason !== undefined) updates.loss_reason = parsed.data.loss_reason === null ? null : normalizeText(parsed.data.loss_reason);
  if (parsed.data.custom_fields !== undefined) {
    const valid = await validateDealCustomFields(auth.organizationId, parsed.data.custom_fields);
    if (valid.error) return NextResponse.json({ error: valid.error, code: valid.status === 500 ? 'DB_ERROR' : 'VALIDATION_ERROR' }, { status: valid.status ?? 422 });
    const existing = await sbGetDealCustomFields(auth.organizationId, dealId);
    if (existing.error) return NextResponse.json({ error: 'Internal server error', code: 'DB_ERROR' }, { status: 500 });
    if (!existing.data) return NextResponse.json({ error: 'Deal not found', code: 'NOT_FOUND' }, { status: 404 });
    updates.custom_fields = { ...((existing.data.custom_fields as Record<string, unknown> | null) ?? {}), ...valid.data };
  }
  updates.updated_at = new Date().toISOString();

  const sb = createStaticAdminClient();
  if (parsed.data.contact_id) {
    const { data: contact, error } = await sb.from('contacts').select('id').eq('id', parsed.data.contact_id).eq('organization_id', auth.organizationId).is('deleted_at', null).maybeSingle();
    if (error) return NextResponse.json({ error: 'Internal server error', code: 'DB_ERROR' }, { status: 500 });
    if (!contact) return NextResponse.json({ error: 'Contact not found', code: 'VALIDATION_ERROR' }, { status: 422 });
  }
  if (parsed.data.client_company_id) {
    const { data: company, error } = await sb.from('crm_companies').select('id').eq('id', parsed.data.client_company_id).eq('organization_id', auth.organizationId).is('deleted_at', null).maybeSingle();
    if (error) return NextResponse.json({ error: 'Internal server error', code: 'DB_ERROR' }, { status: 500 });
    if (!company) return NextResponse.json({ error: 'Client company not found', code: 'VALIDATION_ERROR' }, { status: 422 });
  }
  const { data, error } = await sb
    .from('deals')
    .update(updates)
    .eq('organization_id', auth.organizationId)
    .eq('id', dealId)
    .select('id,title,value,board_id,stage_id,contact_id,client_company_id,is_won,is_lost,loss_reason,closed_at,created_at,updated_at,custom_fields')
    .maybeSingle();

  if (error) {
    console.error('[API] Database error:', error)
    return NextResponse.json({ error: 'Internal server error', code: 'DB_ERROR' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Deal not found', code: 'NOT_FOUND' }, { status: 404 });

  return NextResponse.json({ data: { ...data, custom_fields: data.custom_fields ?? {} } });
}

async function sbGetDealCustomFields(organizationId: string, dealId: string) {
  return createStaticAdminClient().from('deals').select('custom_fields').eq('organization_id', organizationId).is('deleted_at', null).eq('id', dealId).maybeSingle();
}

