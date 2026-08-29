import { getClient } from './client';
import type { CustomFieldDefinition, CustomFieldType } from '@/types';

export type CustomFieldDefinitionInput = {
  key: string;
  label: string;
  type: CustomFieldType;
  options?: string[];
};

export type DbCustomFieldDefinition = CustomFieldDefinitionInput & {
  id: string;
  organization_id: string;
  entity_type: 'deal' | 'contact';
  options: string[] | null;
  created_at: string;
};

async function organizationId() {
  const sb = getClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await sb.from('profiles').select('organization_id').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (!data?.organization_id) throw new Error('Organization not found');
  return data.organization_id as string;
}

const toApp = (row: DbCustomFieldDefinition): CustomFieldDefinition => ({
  id: row.id,
  key: row.key,
  label: row.label,
  type: row.type,
  options: row.options ?? undefined,
});

export const customFieldDefinitionsService = {
  async getAll(): Promise<{ data: CustomFieldDefinition[] | null; error: Error | null }> {
    try {
      const orgId = await organizationId();
      const { data, error } = await getClient().from('custom_field_definitions').select('id,key,label,type,options,entity_type,organization_id,created_at').eq('organization_id', orgId).eq('entity_type', 'deal').order('created_at', { ascending: true });
      return { data: error ? null : (data || []).map(toApp), error };
    } catch (error) { return { data: null, error: error as Error }; }
  },
  async create(input: CustomFieldDefinitionInput) {
    try {
      const orgId = await organizationId();
      const { data, error } = await getClient().from('custom_field_definitions').insert({ organization_id: orgId, entity_type: 'deal', key: input.key, label: input.label, type: input.type, options: input.options ?? null }).select('id,key,label,type,options,entity_type,organization_id,created_at').single();
      return { data: data ? toApp(data as DbCustomFieldDefinition) : null, error };
    } catch (error) { return { data: null, error: error as Error }; }
  },
  async update(id: string, input: Omit<CustomFieldDefinitionInput, 'key' | 'type'>) {
    try {
      const orgId = await organizationId();
      const { data, error } = await getClient().from('custom_field_definitions').update({ label: input.label, options: input.options ?? null }).eq('id', id).eq('organization_id', orgId).eq('entity_type', 'deal').select('id,key,label,type,options,entity_type,organization_id,created_at').single();
      return { data: data ? toApp(data as DbCustomFieldDefinition) : null, error };
    } catch (error) { return { data: null, error: error as Error }; }
  },
  async remove(id: string) {
    try {
      const orgId = await organizationId();
      const { error } = await getClient().from('custom_field_definitions').delete().eq('id', id).eq('organization_id', orgId).eq('entity_type', 'deal');
      return { error };
    } catch (error) { return { error: error as Error }; }
  },
};
