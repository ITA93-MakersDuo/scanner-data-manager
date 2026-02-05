import { restGet, restInsert, restUpdate, restDelete, restCount } from '../config/database';
import { z } from 'zod';

export const ScanSchema = z.object({
  id: z.number().optional(),
  filename: z.string().min(1),
  object_name: z.string().min(1),
  scan_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  scanner_model: z.string().nullable().optional(),
  resolution: z.string().nullable().optional(),
  accuracy: z.string().nullable().optional(),
  file_path: z.string().min(1),
  file_format: z.string().min(1),
  file_size: z.number().positive(),
  thumbnail_path: z.string().nullable().optional(),
  current_version: z.number().default(1),
  project_id: z.number().nullable().optional(),
  created_by: z.string().nullable().optional(),
  user_id: z.number().nullable().optional(),
});

export const ScanUpdateSchema = ScanSchema.partial().omit({ id: true, file_path: true, file_format: true, file_size: true, user_id: true });

export type Scan = z.infer<typeof ScanSchema>;
export type ScanUpdate = z.infer<typeof ScanUpdateSchema>;

export interface ScanWithTags extends Scan {
  tags: { id: number; name: string; color: string }[];
  project_name?: string;
}

function transformScanRow(row: any): ScanWithTags {
  const { projects: proj, scan_tags: st, ...rest } = row;
  return {
    ...rest,
    project_name: proj?.name || null,
    tags: (st || []).map((item: any) => item.tags).filter(Boolean),
  };
}

export const ScanModel = {
  async findAll(options: { limit?: number; offset?: number; project_id?: number; search?: string; user_id?: number } = {}) {
    const { limit = 50, offset = 0, project_id, search, user_id } = options;

    const params: string[] = [
      'select=*,projects(name),scan_tags(tags(id,name,color))',
      'order=created_at.desc',
      `limit=${limit}`,
      `offset=${offset}`,
    ];

    if (user_id) {
      params.push(`user_id=eq.${user_id}`);
    }

    if (project_id) {
      params.push(`project_id=eq.${project_id}`);
    }

    if (search) {
      const s = encodeURIComponent(search);
      params.push(`or=(object_name.ilike.*${s}*,filename.ilike.*${s}*,notes.ilike.*${s}*)`);
    }

    const rows = await restGet('scans', params.join('&'));
    return rows.map(transformScanRow);
  },

  async findById(id: number): Promise<ScanWithTags | null> {
    const rows = await restGet('scans', `select=*,projects(name),scan_tags(tags(id,name,color))&id=eq.${id}`);
    if (rows.length === 0) return null;
    return transformScanRow(rows[0]);
  },

  async findByNameAndUser(objectName: string, userId: number): Promise<boolean> {
    const rows = await restGet('scans', `select=id&object_name=eq.${encodeURIComponent(objectName)}&user_id=eq.${userId}&limit=1`);
    return rows.length > 0;
  },

  async create(data: Omit<Scan, 'id'>) {
    const row = await restInsert('scans', {
      filename: data.filename,
      object_name: data.object_name,
      scan_date: data.scan_date || null,
      notes: data.notes || null,
      scanner_model: data.scanner_model || null,
      resolution: data.resolution || null,
      accuracy: data.accuracy || null,
      file_path: data.file_path,
      file_format: data.file_format,
      file_size: data.file_size,
      thumbnail_path: data.thumbnail_path || null,
      current_version: data.current_version || 1,
      project_id: data.project_id || null,
      created_by: data.created_by || null,
      user_id: data.user_id || null,
    });
    return this.findById(row.id);
  },

  async update(id: number, data: ScanUpdate) {
    const updateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) return this.findById(id);

    updateData.updated_at = new Date().toISOString();

    await restUpdate('scans', `id=eq.${id}`, updateData);
    return this.findById(id);
  },

  async delete(id: number) {
    await restDelete('scans', `id=eq.${id}`);
  },

  async setTags(scanId: number, tagIds: number[]) {
    await restDelete('scan_tags', `scan_id=eq.${scanId}`);
    if (tagIds.length > 0) {
      const body = tagIds.map(tagId => ({ scan_id: scanId, tag_id: tagId }));
      await restInsert('scan_tags', body);
    }
    return this.findById(scanId);
  },

  async count(options: { project_id?: number; search?: string; user_id?: number } = {}) {
    const params: string[] = [];

    if (options.user_id) {
      params.push(`user_id=eq.${options.user_id}`);
    }

    if (options.project_id) {
      params.push(`project_id=eq.${options.project_id}`);
    }

    if (options.search) {
      const s = encodeURIComponent(options.search);
      params.push(`or=(object_name.ilike.*${s}*,filename.ilike.*${s}*,notes.ilike.*${s}*)`);
    }

    return restCount('scans', params.join('&'));
  },
};
