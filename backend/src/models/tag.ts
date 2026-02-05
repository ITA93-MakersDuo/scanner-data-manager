import { restGet, restInsert, restUpdate, restDelete } from '../config/database';
import { z } from 'zod';

export const TagSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
});

export type Tag = z.infer<typeof TagSchema>;

export const TagModel = {
  async findAll() {
    const rows = await restGet('tags', 'select=*,scan_tags(count)&order=name.asc');
    return rows.map((row: any) => {
      const { scan_tags, ...rest } = row;
      return {
        ...rest,
        usage_count: scan_tags?.[0]?.count || 0,
      };
    }) as (Tag & { usage_count: number })[];
  },

  async findById(id: number): Promise<Tag | null> {
    const rows = await restGet('tags', `id=eq.${id}`);
    return rows[0] || null;
  },

  async findByName(name: string): Promise<Tag | null> {
    const rows = await restGet('tags', `name=eq.${encodeURIComponent(name)}`);
    return rows[0] || null;
  },

  async create(data: Omit<Tag, 'id'>) {
    return await restInsert('tags', {
      name: data.name,
      color: data.color || '#6366f1',
    }) as Tag;
  },

  async update(id: number, data: Partial<Omit<Tag, 'id'>>) {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.color !== undefined) updateData.color = data.color;

    if (Object.keys(updateData).length === 0) return this.findById(id);

    await restUpdate('tags', `id=eq.${id}`, updateData);
    return this.findById(id);
  },

  async delete(id: number) {
    await restDelete('tags', `id=eq.${id}`);
  },
};
