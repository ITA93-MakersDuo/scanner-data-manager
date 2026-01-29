import db from '../config/database';
import { z } from 'zod';

export const TagSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
});

export type Tag = z.infer<typeof TagSchema>;

export const TagModel = {
  findAll() {
    const tags = db.prepare(`
      SELECT t.*, COUNT(st.scan_id) as usage_count
      FROM tags t
      LEFT JOIN scan_tags st ON t.id = st.tag_id
      GROUP BY t.id
      ORDER BY t.name ASC
    `).all() as (Tag & { usage_count: number })[];

    return tags;
  },

  findById(id: number): Tag | null {
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag | undefined || null;
  },

  findByName(name: string): Tag | null {
    return db.prepare('SELECT * FROM tags WHERE name = ?').get(name) as Tag | undefined || null;
  },

  create(data: Omit<Tag, 'id'>) {
    const stmt = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)');
    const result = stmt.run(data.name, data.color || '#6366f1');
    return this.findById(result.lastInsertRowid as number);
  },

  update(id: number, data: Partial<Omit<Tag, 'id'>>) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.color !== undefined) {
      fields.push('color = ?');
      values.push(data.color);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);

    const stmt = db.prepare(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id);
  },

  delete(id: number) {
    const stmt = db.prepare('DELETE FROM tags WHERE id = ?');
    return stmt.run(id);
  },

  findByScanId(scanId: number) {
    return db.prepare(`
      SELECT t.*
      FROM tags t
      JOIN scan_tags st ON t.id = st.tag_id
      WHERE st.scan_id = ?
    `).all(scanId) as Tag[];
  },
};
