import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeText } from '@/lib/public-api/sanitize';
import type { LandingSubject } from './config';

type LandingCrmInput = {
  organizationId: string;
  boardId: string;
  stageId: string;
  submissionId: string;
  contactId: string | null;
  dealId: string | null;
  activityId: string | null;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  subject: LandingSubject;
  message: string;
};

function dbError(code: string, error: unknown): Error {
  return Object.assign(new Error(code), { code, cause: error });
}

async function resolveCompany(db: SupabaseClient, input: LandingCrmInput) {
  if (!input.companyName) return null;
  try {
    const existing = await db.from('crm_companies').select('id').eq('organization_id', input.organizationId)
      .is('deleted_at', null).ilike('name', input.companyName).limit(1).maybeSingle();
    if (existing.error) return null;
    if (existing.data?.id) return existing.data.id as string;
    const created = await db.from('crm_companies').insert({ organization_id: input.organizationId, name: input.companyName, owner_id: null }).select('id').single();
    if (created.error) return null;
    return created.data.id as string;
  } catch {
    // Company is optional. A company failure must not discard the lead.
    return null;
  }
}

async function resolveContact(db: SupabaseClient, input: LandingCrmInput, companyId: string | null) {
  if (input.contactId) {
    const existing = await db.from('contacts').select('id, organization_id').eq('id', input.contactId).eq('organization_id', input.organizationId).maybeSingle();
    if (existing.error) throw dbError('CRM_CONTACT_RESUME_FAILED', existing.error);
    if (existing.data?.id) return existing.data.id as string;
  }

  const filters = [`email.eq.${input.email}`];
  if (input.phone) filters.push(`phone.eq.${input.phone}`);
  const found = await db.from('contacts').select('id, name, email, phone').eq('organization_id', input.organizationId).is('deleted_at', null).or(filters.join(',')).limit(1).maybeSingle();
  if (found.error) throw dbError('CRM_CONTACT_LOOKUP_FAILED', found.error);
  if (found.data?.id) {
    const updates: Record<string, unknown> = { source: 'WEBSITE' };
    if (!found.data.name || found.data.name === 'Sem nome') updates.name = input.name;
    if (!found.data.email) updates.email = input.email;
    if (!found.data.phone && input.phone) updates.phone = input.phone;
    if (companyId) updates.client_company_id = companyId;
    const updated = await db.from('contacts').update(updates).eq('id', found.data.id).eq('organization_id', input.organizationId).select('id').single();
    if (updated.error) throw dbError('CRM_CONTACT_UPDATE_FAILED', updated.error);
    return updated.data.id as string;
  }

  const created = await db.from('contacts').insert({ organization_id: input.organizationId, name: input.name, email: input.email, phone: input.phone, company_name: input.companyName, client_company_id: companyId, source: 'WEBSITE', owner_id: null }).select('id').single();
  if (created.error) throw dbError('CRM_CONTACT_CREATE_FAILED', created.error);
  return created.data.id as string;
}

async function resolveDeal(db: SupabaseClient, input: LandingCrmInput, companyId: string | null, contactId: string) {
  if (input.dealId) {
    const existing = await db.from('deals').select('id, organization_id').eq('id', input.dealId).eq('organization_id', input.organizationId).maybeSingle();
    if (existing.error) throw dbError('CRM_DEAL_RESUME_FAILED', existing.error);
    if (existing.data?.id) return existing.data.id as string;
  }

  const existing = await db.from('deals').select('id').eq('organization_id', input.organizationId).eq('board_id', input.boardId).eq('contact_id', contactId).eq('is_won', false).eq('is_lost', false).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (existing.error) throw dbError('CRM_DEAL_LOOKUP_FAILED', existing.error);
  const tags = ['Landing HGA', `Landing: ${input.subject}`];
  if (existing.data?.id) {
    const updated = await db.from('deals').update({ title: `Lead — ${input.name}`, client_company_id: companyId, tags }).eq('id', existing.data.id).eq('organization_id', input.organizationId).select('id').single();
    if (updated.error) throw dbError('CRM_DEAL_UPDATE_FAILED', updated.error);
    return updated.data.id as string;
  }

  const created = await db.from('deals').insert({ organization_id: input.organizationId, title: `Lead — ${input.name}`, value: 0, probability: 10, priority: 'medium', board_id: input.boardId, stage_id: input.stageId, contact_id: contactId, client_company_id: companyId, tags, owner_id: null, last_stage_change_date: new Date().toISOString() }).select('id').single();
  if (created.error) throw dbError('CRM_DEAL_CREATE_FAILED', created.error);
  return created.data.id as string;
}

async function resolveActivity(db: SupabaseClient, input: LandingCrmInput, contactId: string, dealId: string) {
  if (input.activityId) {
    const existing = await db.from('activities').select('id').eq('id', input.activityId).eq('organization_id', input.organizationId).maybeSingle();
    if (existing.error) throw dbError('CRM_ACTIVITY_RESUME_FAILED', existing.error);
    if (existing.data?.id) return existing.data.id as string;
  }
  // The submission id is a deterministic technical marker. It lets a retry
  // recover an activity created just before a progress update was lost.
  const title = `Mensagem da landing — ${input.subject} — ${input.submissionId}`;
  const recovered = await db.from('activities').select('id').eq('organization_id', input.organizationId).eq('deal_id', dealId).eq('contact_id', contactId).eq('type', 'NOTE').eq('title', title).limit(1).maybeSingle();
  if (recovered.error) throw dbError('CRM_ACTIVITY_LOOKUP_FAILED', recovered.error);
  if (recovered.data?.id) return recovered.data.id as string;

  const created = await db.from('activities').insert({ title, description: input.message, type: 'NOTE', date: new Date().toISOString(), completed: true, deal_id: dealId, contact_id: contactId, organization_id: input.organizationId, owner_id: null }).select('id').single();
  if (created.error) throw dbError('CRM_ACTIVITY_CREATE_FAILED', created.error);
  return created.data.id as string;
}

export async function processLandingCrm(
  db: SupabaseClient,
  input: LandingCrmInput,
  onProgress?: (field: 'crm_contact_id' | 'crm_deal_id' | 'crm_activity_id', value: string) => Promise<void>,
) {
  const companyId = await resolveCompany(db, input);
  const contactId = await resolveContact(db, input, companyId);
  await onProgress?.('crm_contact_id', contactId);
  const dealId = await resolveDeal(db, input, companyId, contactId);
  await onProgress?.('crm_deal_id', dealId);
  const activityId = await resolveActivity(db, input, contactId, dealId);
  await onProgress?.('crm_activity_id', activityId);
  return { contactId, dealId, activityId };
}
