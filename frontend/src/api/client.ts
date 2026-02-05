const API_BASE = '/api/v1';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function authJsonHeaders(): Record<string, string> {
  return { ...authHeaders(), 'Content-Type': 'application/json' };
}

export interface Scan {
  id: number;
  filename: string;
  object_name: string;
  scan_date: string | null;
  notes: string | null;
  scanner_model: string | null;
  resolution: string | null;
  accuracy: string | null;
  file_path: string;
  file_format: string;
  file_size: number;
  thumbnail_path: string | null;
  current_version: number;
  project_id: number | null;
  project_name?: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  usage_count?: number;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  scan_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ScanVersion {
  id: number;
  scan_id: number;
  version_number: number;
  file_path: string;
  file_size: number;
  change_notes: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }
  if (response.status === 204) {
    return null as T;
  }
  return response.json();
}

export const api = {
  scans: {
    async getAll(params?: { limit?: number; offset?: number; project_id?: number; search?: string }) {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));
      if (params?.project_id) searchParams.set('project_id', String(params.project_id));
      if (params?.search) searchParams.set('search', params.search);

      const response = await fetch(`${API_BASE}/scans?${searchParams}`, { headers: authHeaders() });
      return handleResponse<PaginatedResponse<Scan>>(response);
    },

    async getById(id: number) {
      const response = await fetch(`${API_BASE}/scans/${id}`, { headers: authHeaders() });
      return handleResponse<Scan & { versions: ScanVersion[] }>(response);
    },

    async create(formData: FormData) {
      const response = await fetch(`${API_BASE}/scans`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      return handleResponse<Scan>(response);
    },

    async update(id: number, data: Partial<Scan> & { tags?: number[] }) {
      const response = await fetch(`${API_BASE}/scans/${id}`, {
        method: 'PUT',
        headers: authJsonHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<Scan>(response);
    },

    async delete(id: number) {
      const response = await fetch(`${API_BASE}/scans/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      return handleResponse<void>(response);
    },

    async uploadNewVersion(id: number, formData: FormData) {
      const response = await fetch(`${API_BASE}/scans/${id}/versions`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      return handleResponse<Scan>(response);
    },

    getDownloadUrl(id: number) {
      return `${API_BASE}/scans/${id}/download`;
    },

    async getFileUrl(id: number): Promise<string> {
      const response = await fetch(`${API_BASE}/scans/${id}/file-url`, { headers: authHeaders() });
      const data = await response.json();
      return data.url;
    },
  },

  projects: {
    async getAll() {
      const response = await fetch(`${API_BASE}/projects`, { headers: authHeaders() });
      return handleResponse<Project[]>(response);
    },

    async getById(id: number) {
      const response = await fetch(`${API_BASE}/projects/${id}`, { headers: authHeaders() });
      return handleResponse<Project>(response);
    },

    async create(data: { name: string; description?: string }) {
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: authJsonHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<Project>(response);
    },

    async update(id: number, data: Partial<Project>) {
      const response = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'PUT',
        headers: authJsonHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<Project>(response);
    },

    async delete(id: number) {
      const response = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      return handleResponse<void>(response);
    },
  },

  tags: {
    async getAll() {
      const response = await fetch(`${API_BASE}/tags`, { headers: authHeaders() });
      return handleResponse<Tag[]>(response);
    },

    async create(data: { name: string; color?: string }) {
      const response = await fetch(`${API_BASE}/tags`, {
        method: 'POST',
        headers: authJsonHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<Tag>(response);
    },

    async update(id: number, data: Partial<Tag>) {
      const response = await fetch(`${API_BASE}/tags/${id}`, {
        method: 'PUT',
        headers: authJsonHeaders(),
        body: JSON.stringify(data),
      });
      return handleResponse<Tag>(response);
    },

    async delete(id: number) {
      const response = await fetch(`${API_BASE}/tags/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      return handleResponse<void>(response);
    },
  },
};
