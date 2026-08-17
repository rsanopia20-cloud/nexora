import { Router } from 'express';
import {
  getAllUsers,
  getDashboardSummary,
  getLinkDetail,
  getLinkStats,
  getUserHistory,
} from '../controllers/analyticsController.js';

const router = Router();

// TODO: Add admin-only auth middleware before these handlers go to production.

router.get('/summary', getDashboardSummary);
router.get('/links', getLinkStats);
router.get('/links/:linkId', getLinkDetail);
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserHistory);

export default router;
