import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { requireAuth } from '../middleware/auth.js';
import {
  editConversionRecord,
  getCustomerEarningsDetail,
  getCustomerEarningsSummary,
  getManualBatchDetail,
  getMyEarnings,
  getUnmatchedRecords,
  ignoreRecord,
  listManualBatches,
  markCustomerAsPaid,
  manuallyMatchRecord,
  searchUsers,
  updateUserReferralCode,
  uploadConversionExcel,
} from '../controllers/conversionController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter(_req, file, cb) {
    const allowed =
      /\.(xlsx|xls)$/i.test(file.originalname) ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel';

    if (allowed) {
      cb(null, true);
      return;
    }

    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
  },
});

const router = Router();
const adminUserSearchRouter = Router();
const userConversionRouter = Router();

router.use(requireAdmin);
adminUserSearchRouter.use(requireAdmin);

router.get('/unmatched', getUnmatchedRecords);
router.get('/manual-batches', listManualBatches);
router.get('/manual-batches/:batchId', getManualBatchDetail);
router.get('/customers-summary', getCustomerEarningsSummary);
router.get('/customers/:userId', getCustomerEarningsDetail);
router.put('/customers/:userId/mark-paid', markCustomerAsPaid);
router.put('/:id/match', manuallyMatchRecord);
router.put('/:id/ignore', ignoreRecord);
router.put('/:id/edit', editConversionRecord);
router.post('/upload', upload.single('file'), uploadConversionExcel);

adminUserSearchRouter.get('/search', searchUsers);
adminUserSearchRouter.put('/:userId/referral-code', updateUserReferralCode);
userConversionRouter.use(requireAuth);
userConversionRouter.get('/me', getMyEarnings);

export { adminUserSearchRouter };
export { userConversionRouter };
export default router;
