import { Router } from 'express';
import { adminLogin, adminLogout, adminMe } from '../controllers/adminAuthController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.post('/login', adminLogin);
router.post('/logout', adminLogout);
router.get('/me', requireAdmin, adminMe);

export default router;
