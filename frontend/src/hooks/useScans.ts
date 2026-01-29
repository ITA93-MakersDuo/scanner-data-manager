import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Scan } from '../api/client';

export function useScans(params?: { limit?: number; offset?: number; project_id?: number; search?: string }) {
  return useQuery({
    queryKey: ['scans', params],
    queryFn: () => api.scans.getAll(params),
  });
}

export function useScan(id: number) {
  return useQuery({
    queryKey: ['scan', id],
    queryFn: () => api.scans.getById(id),
    enabled: !!id,
  });
}

export function useCreateScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => api.scans.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}

export function useUpdateScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Scan> & { tags?: number[] } }) =>
      api.scans.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      queryClient.invalidateQueries({ queryKey: ['scan', id] });
    },
  });
}

export function useDeleteScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.scans.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
    },
  });
}

export function useUploadNewVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      api.scans.uploadNewVersion(id, formData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      queryClient.invalidateQueries({ queryKey: ['scan', id] });
    },
  });
}
