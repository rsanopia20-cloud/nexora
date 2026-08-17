import { Router } from 'express';
import {
  getAllUsers,
  getDashboardSummary,
  getLinkDetail,
  getLinkStats,
  getUserHistory,
} from '../controllers/analyticsController.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.use(requireAdmin);

router.get('/summary', getDashboardSummary);
router.get('/links', getLinkStats);
router.get('/links/:linkId', getLinkDetail);
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserHistory);

export default router;
