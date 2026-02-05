import { restGet, restInsert, restDelete } from '../config/database';
import { z } from 'zod';

export const ScanVersionSchema = z.object({
  id: z.number().optional(),
  scan_id: z.number(),
  version_number: z.number().positive(),
  file_path: z.string().min(1),
  file_size: z.number().positive(),
  change_notes: z.string().nullable().optional(),
});

export type ScanVersion = z.infer<typeof ScanVersionSchema>;

export const ScanVersionModel = {
  async findByScanId(scanId: number) {
    return await restGet('scan_versions', `scan_id=eq.${scanId}&order=version_number.desc`) as ScanVersion[];
  },

  async findById(id: number): Promise<ScanVersion | null> {
    const rows = await restGet('scan_versions', `id=eq.${id}`);
    return rows[0] || null;
  },

  async create(data: Omit<ScanVersion, 'id'>) {
    return await restInsert('scan_versions', {
      scan_id: data.scan_id,
      version_number: data.version_number,
      file_path: data.file_path,
      file_size: data.file_size,
      change_notes: data.change_notes || null,
    }) as ScanVersion;
  },

  async getLatestVersion(scanId: number): Promise<number> {
    const rows = await restGet('scan_versions', `scan_id=eq.${scanId}&select=version_number&order=version_number.desc&limit=1`);
    return rows[0]?.version_number || 0;
  },

  async delete(id: number) {
    await restDelete('scan_versions', `id=eq.${id}`);
  },
};
