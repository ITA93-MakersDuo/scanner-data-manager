import db from '../config/database';
import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const ProjectModel = {
  findAll() {
    const projects = db.prepare(`
      SELECT p.*, COUNT(s.id) as scan_count
      FROM projects p
      LEFT JOIN scans s ON p.id = s.project_id
      GROUP BY p.id
      ORDER BY p.name ASC
    `).all() as (Project & { scan_count: number })[];

    return projects;
  },

  findById(id: number): Project | null {
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined || null;
  },

  findByName(name: string): Project | null {
    return db.prepare('SELECT * FROM projects WHERE name = ?').get(name) as Project | undefined || null;
  },

  create(data: Omit<Project, 'id'>) {
    const stmt = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)');
    const result = stmt.run(data.name, data.description || null);
    return this.findById(result.lastInsertRowid as number);
  },

  update(id: number, data: Partial<Omit<Project, 'id'>>) {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id);
  },

  delete(id: number) {
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    return stmt.run(id);
  },
};
