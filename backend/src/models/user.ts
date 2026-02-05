import { restGet, restInsert } from '../config/database';
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number().optional(),
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string().min(1),
});

export type User = z.infer<typeof UserSchema>;

export const UserModel = {
  async findByEmail(email: string): Promise<User | null> {
    const rows = await restGet('users', `email=eq.${encodeURIComponent(email)}`);
    return rows[0] || null;
  },

  async findById(id: number): Promise<User | null> {
    const rows = await restGet('users', `id=eq.${id}`);
    return rows[0] || null;
  },

  async create(data: Omit<User, 'id'>) {
    return await restInsert('users', {
      email: data.email,
      password_hash: data.password_hash,
      name: data.name,
    }) as User;
  },
};
