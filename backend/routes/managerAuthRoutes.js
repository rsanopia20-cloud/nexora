import { Router } from 'express';
import {
  managerLogin,
  managerLogout,
  managerMe,
  updateManagerBankDetails,
} from '../controllers/managerAuthController.js';
import { getMyManagerEarnings } from '../controllers/conversionController.js';
import { requireManager } from '../middleware/requireManager.js';

const router = Router();

router.post('/login', managerLogin);
router.post('/logout', managerLogout);
router.get('/me', requireManager, managerMe);
router.put('/bank-details', requireManager, updateManagerBankDetails);
router.get('/earnings', requireManager, getMyManagerEarnings);

export default router;
