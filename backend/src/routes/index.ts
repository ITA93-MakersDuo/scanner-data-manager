import { Router } from 'express';
import authRoutes from './authRoutes';
import scanRoutes from './scanRoutes';
import projectRoutes from './projectRoutes';
import tagRoutes from './tagRoutes';
import { authMiddleware } from '../middleware/auth';
import { scanController } from '../controllers';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Public file serving (img tags and 3D viewer cannot send Authorization headers)
router.get('/scans/:id/file', scanController.serveFile);
router.get('/scans/:id/thumbnail', scanController.serveThumbnail);
router.get('/scans/:id/download', scanController.download);

// Protected routes (require login)
router.use('/scans', authMiddleware, scanRoutes);
router.use('/projects', authMiddleware, projectRoutes);
router.use('/tags', authMiddleware, tagRoutes);

export default router;
