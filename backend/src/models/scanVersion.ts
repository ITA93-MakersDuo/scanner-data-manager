import pool from '../config/database';
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
    const { rows } = await pool.query(
      'SELECT * FROM scan_versions WHERE scan_id = $1 ORDER BY version_number DESC',
      [scanId]
    );
    return rows as ScanVersion[];
  },

  async findById(id: number): Promise<ScanVersion | null> {
    const { rows } = await pool.query('SELECT * FROM scan_versions WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create(data: Omit<ScanVersion, 'id'>) {
    const { rows } = await pool.query(
      `INSERT INTO scan_versions (scan_id, version_number, file_path, file_size, change_notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.scan_id, data.version_number, data.file_path, data.file_size, data.change_notes || null]
    );
    return rows[0] as ScanVersion;
  },

  async getLatestVersion(scanId: number): Promise<number> {
    const { rows } = await pool.query(
      'SELECT MAX(version_number) as max_version FROM scan_versions WHERE scan_id = $1',
      [scanId]
    );
    return rows[0]?.max_version || 0;
  },

  async delete(id: number) {
    await pool.query('DELETE FROM scan_versions WHERE id = $1', [id]);
  },
};
