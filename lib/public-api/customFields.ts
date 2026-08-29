import { z } from 'zod';
import { createStaticAdminClient } from '@/lib/supabase/server';

const MAX_FIELDS = 50;
const MAX_KEY_LENGTH = 100;
const MAX_TEXT_LENGTH = 10_000;
const MAX_OPTIONS = 100;

export const PublicCustomFieldsSchema = z.record(z.string().max(MAX_KEY_LENGTH), z.unknown()).refine(
  (value) => Object.keys(value).length <= MAX_FIELDS,
  'Too many custom fields'
);

type Definition = { key: string; type: string; options: string[] | null; entity_type: string; organization_id: string };

export async function validateDealCustomFields(
  organizationId: string,
  fields: Record<string, unknown>
): Promise<{ data: Record<string, unknown> | null; error: string | null; status?: number }> {
  const sb = createStaticAdminClient();
  const keys = Object.keys(fields);
  if (keys.length > MAX_FIELDS) return { data: null, error: 'Too many custom fields', status: 422 };
  if (keys.some((key) => key.length === 0 || key.length > MAX_KEY_LENGTH)) {
    return { data: null, error: 'Invalid custom field key', status: 422 };
  }

  const { data: definitions, error } = await sb
    .from('custom_field_definitions')
    .select('key,type,options,entity_type,organization_id')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'deal')
    .in('key', keys);
  if (error) return { data: null, error: 'Internal server error', status: 500 };

  const byKey = new Map((definitions as Definition[] | null ?? []).map((definition) => [definition.key, definition]));
  for (const key of keys) {
    const definition = byKey.get(key);
    if (!definition) return { data: null, error: `Unknown custom field: ${key}`, status: 422 };
    const value = fields[key];
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      return { data: null, error: `Invalid value for custom field: ${key}`, status: 422 };
    }
    if (definition.type === 'text' && typeof value !== 'string') {
      return { data: null, error: `Custom field ${key} must be text`, status: 422 };
    }
    if (definition.type === 'text' && (value as string).length > MAX_TEXT_LENGTH) {
      return { data: null, error: `Custom field ${key} is too long`, status: 422 };
    }
    if (definition.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
      return { data: null, error: `Custom field ${key} must be a finite number`, status: 422 };
    }
    if (definition.type === 'select' && (typeof value !== 'string' || !(definition.options ?? []).includes(value))) {
      return { data: null, error: `Invalid option for custom field: ${key}`, status: 422 };
    }
    if (definition.type === 'date' && (typeof value !== 'string' || !isStrictDate(value))) {
      return { data: null, error: `Custom field ${key} must use YYYY-MM-DD`, status: 422 };
    }
  }
  return { data: fields, error: null };
}

function isStrictDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
