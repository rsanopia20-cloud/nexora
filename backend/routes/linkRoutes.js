import { Router } from 'express';
import {
  createLink,
  deleteLink,
  getAllLinks,
  permanentDeleteLink,
  updateLink,
} from '../controllers/linkController.js';

const router = Router();

// TODO: Add admin-only auth middleware before these handlers go to production.

router.post('/', createLink);
router.get('/', getAllLinks);
router.put('/:id', updateLink);
router.delete('/:id/permanent', permanentDeleteLink);
router.delete('/:id', deleteLink);

export default router;
