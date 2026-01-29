import db from '../config/database';
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
  findByScanId(scanId: number) {
    return db.prepare(`
      SELECT * FROM scan_versions
      WHERE scan_id = ?
      ORDER BY version_number DESC
    `).all(scanId) as ScanVersion[];
  },

  findById(id: number): ScanVersion | null {
    return db.prepare('SELECT * FROM scan_versions WHERE id = ?').get(id) as ScanVersion | undefined || null;
  },

  create(data: Omit<ScanVersion, 'id'>) {
    const stmt = db.prepare(`
      INSERT INTO scan_versions (scan_id, version_number, file_path, file_size, change_notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      data.scan_id,
      data.version_number,
      data.file_path,
      data.file_size,
      data.change_notes || null
    );
    return this.findById(result.lastInsertRowid as number);
  },

  getLatestVersion(scanId: number): number {
    const result = db.prepare(`
      SELECT MAX(version_number) as max_version
      FROM scan_versions
      WHERE scan_id = ?
    `).get(scanId) as { max_version: number | null };

    return result.max_version || 0;
  },

  delete(id: number) {
    const stmt = db.prepare('DELETE FROM scan_versions WHERE id = ?');
    return stmt.run(id);
  },
};
