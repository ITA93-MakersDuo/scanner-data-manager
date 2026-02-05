import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user';
import { AuthRequest, signToken } from '../middleware/auth';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'メールアドレス、パスワード、名前は必須です' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'パスワードは6文字以上で入力してください' });
      }

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const user = await UserModel.create({ email, password_hash, name });

      const token = signToken({ id: user.id!, email: user.email, name: user.name });

      res.status(201).json({
        token,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (error: any) {
      console.error('Registration error:', error?.message || error);
      res.status(500).json({ error: `登録に失敗しました: ${error?.message || '不明なエラー'}` });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'メールアドレスとパスワードは必須です' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
      }

      const token = signToken({ id: user.id!, email: user.email, name: user.name });

      res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name },
      });
    } catch (error: any) {
      console.error('Login error:', error?.message || error);
      res.status(500).json({ error: `ログインに失敗しました: ${error?.message || '不明なエラー'}` });
    }
  },

  async me(req: Request, res: Response) {
    const authReq = req as AuthRequest;
    res.json({ user: authReq.user });
  },
};
