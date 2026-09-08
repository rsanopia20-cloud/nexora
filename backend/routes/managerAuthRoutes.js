import { Router } from 'express';
import {
  managerLogin,
  managerLogout,
  managerMe,
} from '../controllers/managerAuthController.js';
import { getMyManagerEarnings } from '../controllers/conversionController.js';
import { requireManager } from '../middleware/requireManager.js';

const router = Router();

router.post('/login', managerLogin);
router.post('/logout', managerLogout);
router.get('/me', requireManager, managerMe);
router.get('/earnings', requireManager, getMyManagerEarnings);

export default router;
