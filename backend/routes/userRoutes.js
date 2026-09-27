import { Router } from 'express';
import { getMyLinks, updateMyBankDetails, updateMyProfile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/links', requireAuth, getMyLinks);
router.put('/profile', requireAuth, updateMyProfile);
router.put('/bank-details', requireAuth, updateMyBankDetails);

export default router;
