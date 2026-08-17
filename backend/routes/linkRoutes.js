import { Router } from 'express';
import {
  createLink,
  deleteLink,
  getAllLinks,
  permanentDeleteLink,
  updateLink,
} from '../controllers/linkController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.use(requireAdmin);

router.post('/', createLink);
router.get('/', getAllLinks);
router.put('/:id', updateLink);
router.delete('/:id/permanent', permanentDeleteLink);
router.delete('/:id', deleteLink);

export default router;
