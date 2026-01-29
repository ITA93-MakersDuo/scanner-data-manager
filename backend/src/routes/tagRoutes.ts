import { Router } from 'express';
import { tagController } from '../controllers';

const router = Router();

router.get('/', tagController.getAll);
router.get('/:id', tagController.getById);
router.post('/', tagController.create);
router.put('/:id', tagController.update);
router.delete('/:id', tagController.delete);

export default router;
