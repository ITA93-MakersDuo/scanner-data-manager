import { Router } from 'express';
import scanRoutes from './scanRoutes';
import projectRoutes from './projectRoutes';
import tagRoutes from './tagRoutes';

const router = Router();

router.use('/scans', scanRoutes);
router.use('/projects', projectRoutes);
router.use('/tags', tagRoutes);

export default router;
