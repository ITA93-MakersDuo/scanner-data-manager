import pool from '../config/database';
import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const ProjectModel = {
  async findAll() {
    const { rows } = await pool.query(`
      SELECT p.*, COUNT(s.id)::int as scan_count
      FROM projects p
      LEFT JOIN scans s ON p.id = s.project_id
      GROUP BY p.id
      ORDER BY p.name ASC
    `);
    return rows as (Project & { scan_count: number })[];
  },

  async findById(id: number): Promise<Project | null> {
    const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async findByName(name: string): Promise<Project | null> {
    const { rows } = await pool.query('SELECT * FROM projects WHERE name = $1', [name]);
    return rows[0] || null;
  },

  async create(data: Omit<Project, 'id'>) {
    const { rows } = await pool.query(
      'INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *',
      [data.name, data.description || null]
    );
    return rows[0] as Project;
  },

  async update(id: number, data: Partial<Omit<Project, 'id'>>) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
    return this.findById(id);
  },

  async delete(id: number) {
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
  },
};
