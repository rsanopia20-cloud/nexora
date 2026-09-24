import { Router } from 'express';
import {
  forgotPassword,
  login,
  logout,
  me,
  resetPassword,
  signup,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import {
  forgotPasswordRules,
  loginRules,
  resetPasswordRules,
  signupRules,
  validate,
} from '../middleware/validate.js';

const router = Router();

router.post('/signup', signupRules, validate, signup);
router.post('/login', loginRules, validate, login);
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password', resetPasswordRules, validate, resetPassword);
router.get('/me', requireAuth, me);
router.post('/logout', logout);

export default router;
