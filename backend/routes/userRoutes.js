import { Router } from 'express';
import { getMyLinks } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/links', requireAuth, getMyLinks);

export default router;
