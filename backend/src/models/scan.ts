import db from '../config/database';
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
});

export const ScanUpdateSchema = ScanSchema.partial().omit({ id: true, file_path: true, file_format: true, file_size: true });

export type Scan = z.infer<typeof ScanSchema>;
export type ScanUpdate = z.infer<typeof ScanUpdateSchema>;

export interface ScanWithTags extends Scan {
  tags: { id: number; name: string; color: string }[];
  project_name?: string;
}

export const ScanModel = {
  findAll(options: { limit?: number; offset?: number; project_id?: number; search?: string } = {}) {
    const { limit = 50, offset = 0, project_id, search } = options;

    let query = `
      SELECT s.*, p.name as project_name
      FROM scans s
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (project_id) {
      query += ' AND s.project_id = ?';
      params.push(project_id);
    }

    if (search) {
      query += ' AND (s.object_name LIKE ? OR s.filename LIKE ? OR s.notes LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const scans = db.prepare(query).all(...params) as ScanWithTags[];

    // Get tags for each scan
    const tagStmt = db.prepare(`
      SELECT t.id, t.name, t.color
      FROM tags t
      JOIN scan_tags st ON t.id = st.tag_id
      WHERE st.scan_id = ?
    `);

    for (const scan of scans) {
      scan.tags = tagStmt.all(scan.id) as { id: number; name: string; color: string }[];
    }

    return scans;
  },

  findById(id: number): ScanWithTags | null {
    const scan = db.prepare(`
      SELECT s.*, p.name as project_name
      FROM scans s
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE s.id = ?
    `).get(id) as ScanWithTags | undefined;

    if (!scan) return null;

    scan.tags = db.prepare(`
      SELECT t.id, t.name, t.color
      FROM tags t
      JOIN scan_tags st ON t.id = st.tag_id
      WHERE st.scan_id = ?
    `).all(id) as { id: number; name: string; color: string }[];

    return scan;
  },

  create(data: Omit<Scan, 'id'>) {
    const stmt = db.prepare(`
      INSERT INTO scans (filename, object_name, scan_date, notes, scanner_model, resolution, accuracy, file_path, file_format, file_size, thumbnail_path, current_version, project_id, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.filename,
      data.object_name,
      data.scan_date || null,
      data.notes || null,
      data.scanner_model || null,
      data.resolution || null,
      data.accuracy || null,
      data.file_path,
      data.file_format,
      data.file_size,
      data.thumbnail_path || null,
      data.current_version || 1,
      data.project_id || null,
      data.created_by || null
    );

    return this.findById(result.lastInsertRowid as number);
  },

  update(id: number, data: ScanUpdate) {
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE scans SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id);
  },

  delete(id: number) {
    const stmt = db.prepare('DELETE FROM scans WHERE id = ?');
    return stmt.run(id);
  },

  addTag(scanId: number, tagId: number) {
    const stmt = db.prepare('INSERT OR IGNORE INTO scan_tags (scan_id, tag_id) VALUES (?, ?)');
    return stmt.run(scanId, tagId);
  },

  removeTag(scanId: number, tagId: number) {
    const stmt = db.prepare('DELETE FROM scan_tags WHERE scan_id = ? AND tag_id = ?');
    return stmt.run(scanId, tagId);
  },

  setTags(scanId: number, tagIds: number[]) {
    const deleteStmt = db.prepare('DELETE FROM scan_tags WHERE scan_id = ?');
    const insertStmt = db.prepare('INSERT INTO scan_tags (scan_id, tag_id) VALUES (?, ?)');

    const transaction = db.transaction(() => {
      deleteStmt.run(scanId);
      for (const tagId of tagIds) {
        insertStmt.run(scanId, tagId);
      }
    });

    transaction();
    return this.findById(scanId);
  },

  count(options: { project_id?: number; search?: string } = {}) {
    let query = 'SELECT COUNT(*) as count FROM scans WHERE 1=1';
    const params: any[] = [];

    if (options.project_id) {
      query += ' AND project_id = ?';
      params.push(options.project_id);
    }

    if (options.search) {
      query += ' AND (object_name LIKE ? OR filename LIKE ? OR notes LIKE ?)';
      const searchPattern = `%${options.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const result = db.prepare(query).get(...params) as { count: number };
    return result.count;
  },
};
