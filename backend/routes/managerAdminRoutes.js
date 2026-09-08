import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  createManager,
  getManager,
  listManagers,
  suggestManagerId,
  updateManager,
} from '../controllers/managerController.js';

const router = Router();

router.use(requireAdmin);

router.get('/', listManagers);
router.get('/suggest-id', suggestManagerId);
router.get('/:id', getManager);
router.post('/', createManager);
router.put('/:id', updateManager);

export default router;
