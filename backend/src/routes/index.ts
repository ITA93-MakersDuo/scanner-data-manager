import { Router } from 'express';
import authRoutes from './authRoutes';
import scanRoutes from './scanRoutes';
import projectRoutes from './projectRoutes';
import tagRoutes from './tagRoutes';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes (require login)
router.use('/scans', authMiddleware, scanRoutes);
router.use('/projects', authMiddleware, projectRoutes);
router.use('/tags', authMiddleware, tagRoutes);

export default router;
