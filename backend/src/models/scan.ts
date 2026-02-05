import pool from '../config/database';
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
  async findAll(options: { limit?: number; offset?: number; project_id?: number; search?: string } = {}) {
    const { limit = 50, offset = 0, project_id, search } = options;
    const params: any[] = [];
    let paramIndex = 1;

    let query = `
      SELECT s.*, p.name as project_name
      FROM scans s
      LEFT JOIN projects p ON s.project_id = p.id
      WHERE 1=1
    `;

    if (project_id) {
      query += ` AND s.project_id = $${paramIndex++}`;
      params.push(project_id);
    }

    if (search) {
      query += ` AND (s.object_name ILIKE $${paramIndex} OR s.filename ILIKE $${paramIndex} OR s.notes ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const { rows: scans } = await pool.query(query, params);

    for (const scan of scans) {
      const { rows: tags } = await pool.query(
        `SELECT t.id, t.name, t.color FROM tags t JOIN scan_tags st ON t.id = st.tag_id WHERE st.scan_id = $1`,
        [scan.id]
      );
      scan.tags = tags;
    }

    return scans as ScanWithTags[];
  },

  async findById(id: number): Promise<ScanWithTags | null> {
    const { rows } = await pool.query(
      `SELECT s.*, p.name as project_name FROM scans s LEFT JOIN projects p ON s.project_id = p.id WHERE s.id = $1`,
      [id]
    );

    if (rows.length === 0) return null;

    const scan = rows[0];
    const { rows: tags } = await pool.query(
      `SELECT t.id, t.name, t.color FROM tags t JOIN scan_tags st ON t.id = st.tag_id WHERE st.scan_id = $1`,
      [id]
    );
    scan.tags = tags;

    return scan as ScanWithTags;
  },

  async create(data: Omit<Scan, 'id'>) {
    const { rows } = await pool.query(
      `INSERT INTO scans (filename, object_name, scan_date, notes, scanner_model, resolution, accuracy, file_path, file_format, file_size, thumbnail_path, current_version, project_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        data.filename, data.object_name, data.scan_date || null, data.notes || null,
        data.scanner_model || null, data.resolution || null, data.accuracy || null,
        data.file_path, data.file_format, data.file_size, data.thumbnail_path || null,
        data.current_version || 1, data.project_id || null, data.created_by || null,
      ]
    );

    return this.findById(rows[0].id);
  },

  async update(id: number, data: ScanUpdate) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    await pool.query(`UPDATE scans SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
    return this.findById(id);
  },

  async delete(id: number) {
    await pool.query('DELETE FROM scans WHERE id = $1', [id]);
  },

  async setTags(scanId: number, tagIds: number[]) {
    await pool.query('DELETE FROM scan_tags WHERE scan_id = $1', [scanId]);
    for (const tagId of tagIds) {
      await pool.query('INSERT INTO scan_tags (scan_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [scanId, tagId]);
    }
    return this.findById(scanId);
  },

  async count(options: { project_id?: number; search?: string } = {}) {
    const params: any[] = [];
    let paramIndex = 1;
    let query = 'SELECT COUNT(*) as count FROM scans WHERE 1=1';

    if (options.project_id) {
      query += ` AND project_id = $${paramIndex++}`;
      params.push(options.project_id);
    }

    if (options.search) {
      query += ` AND (object_name ILIKE $${paramIndex} OR filename ILIKE $${paramIndex} OR notes ILIKE $${paramIndex})`;
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count, 10);
  },
};
