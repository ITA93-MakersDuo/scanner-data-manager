import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { scanController } from '../controllers';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.stl', '.ply', '.step', '.stp', '.iges', '.igs', '.obj'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`));
    }
  },
});

// Routes
router.get('/', scanController.getAll);
router.get('/search', scanController.getAll); // Uses same logic with query params
router.get('/:id', scanController.getById);
router.get('/:id/download', scanController.download);
router.post('/', upload.single('file'), scanController.create);
router.put('/:id', scanController.update);
router.delete('/:id', scanController.delete);
router.post('/:id/versions', upload.single('file'), scanController.uploadNewVersion);

export default router;
