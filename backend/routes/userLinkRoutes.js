import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getActiveLinksForUser } from '../controllers/linkController.js';
import { handleAuthenticatedClick } from '../controllers/trackingController.js';

const router = Router();

// Authenticated user-facing link APIs (JWT via requireAuth → req.user)

router.get('/', requireAuth, getActiveLinksForUser);
router.post('/click', requireAuth, handleAuthenticatedClick);

export default router;
