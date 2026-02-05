import pool from '../config/database';
import { z } from 'zod';

export const TagSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
});

export type Tag = z.infer<typeof TagSchema>;

export const TagModel = {
  async findAll() {
    const { rows } = await pool.query(`
      SELECT t.*, COUNT(st.scan_id)::int as usage_count
      FROM tags t
      LEFT JOIN scan_tags st ON t.id = st.tag_id
      GROUP BY t.id
      ORDER BY t.name ASC
    `);
    return rows as (Tag & { usage_count: number })[];
  },

  async findById(id: number): Promise<Tag | null> {
    const { rows } = await pool.query('SELECT * FROM tags WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findByName(name: string): Promise<Tag | null> {
    const { rows } = await pool.query('SELECT * FROM tags WHERE name = $1', [name]);
    return rows[0] || null;
  },

  async create(data: Omit<Tag, 'id'>) {
    const { rows } = await pool.query(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
      [data.name, data.color || '#6366f1']
    );
    return rows[0] as Tag;
  },

  async update(id: number, data: Partial<Omit<Tag, 'id'>>) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.color !== undefined) {
      fields.push(`color = $${paramIndex++}`);
      values.push(data.color);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);

    await pool.query(`UPDATE tags SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
    return this.findById(id);
  },

  async delete(id: number) {
    await pool.query('DELETE FROM tags WHERE id = $1', [id]);
  },
};
