import { restGet, restInsert, restUpdate, restDelete } from '../config/database';
import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const ProjectModel = {
  async findAll() {
    const rows = await restGet('projects', 'select=*,scans(count)&order=name.asc');
    return rows.map((row: any) => {
      const { scans, ...rest } = row;
      return {
        ...rest,
        scan_count: scans?.[0]?.count || 0,
      };
    }) as (Project & { scan_count: number })[];
  },

  async findById(id: number): Promise<Project | null> {
    const rows = await restGet('projects', `id=eq.${id}`);
    return rows[0] || null;
  },

  async findByName(name: string): Promise<Project | null> {
    const rows = await restGet('projects', `name=eq.${encodeURIComponent(name)}`);
    return rows[0] || null;
  },

  async create(data: Omit<Project, 'id'>) {
    return await restInsert('projects', {
      name: data.name,
      description: data.description || null,
    }) as Project;
  },

  async update(id: number, data: Partial<Omit<Project, 'id'>>) {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    if (Object.keys(updateData).length === 0) return this.findById(id);

    updateData.updated_at = new Date().toISOString();

    await restUpdate('projects', `id=eq.${id}`, updateData);
    return this.findById(id);
  },

  async delete(id: number) {
    await restDelete('projects', `id=eq.${id}`);
  },
};
