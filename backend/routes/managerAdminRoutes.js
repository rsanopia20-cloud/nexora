import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  createManager,
  deleteManager,
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
router.delete('/:id', deleteManager);

export default router;
