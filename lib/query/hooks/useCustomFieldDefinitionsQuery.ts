import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customFieldDefinitionsService } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { queryKeys } from '../index';
import type { CustomFieldDefinition } from '@/types';

export const useCustomFieldDefinitions = (options?: { enabled?: boolean }) => {
  const { organizationId, loading: authLoading } = useAuth();
  return useQuery<CustomFieldDefinition[]>({
    queryKey: organizationId ? queryKeys.customFieldDefinitions.byOrg(organizationId) : queryKeys.customFieldDefinitions.all,
    queryFn: async () => { const result = await customFieldDefinitionsService.getAll(); if (result.error) throw result.error; return result.data || []; },
    enabled: !authLoading && !!organizationId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateCustomFieldDefinition = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();
  return useMutation({
    mutationFn: customFieldDefinitionsService.create,
    onSuccess: () => organizationId && queryClient.invalidateQueries({ queryKey: queryKeys.customFieldDefinitions.byOrg(organizationId) }),
  });
};

export const useUpdateCustomFieldDefinition = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof customFieldDefinitionsService.update>[1] }) => customFieldDefinitionsService.update(id, input),
    onSuccess: () => organizationId && queryClient.invalidateQueries({ queryKey: queryKeys.customFieldDefinitions.byOrg(organizationId) }),
  });
};

export const useDeleteCustomFieldDefinition = () => {
  const queryClient = useQueryClient();
  const { organizationId } = useAuth();
  return useMutation({
    mutationFn: (id: string) => customFieldDefinitionsService.remove(id),
    onSuccess: () => organizationId && queryClient.invalidateQueries({ queryKey: queryKeys.customFieldDefinitions.byOrg(organizationId) }),
  });
};
