import { Router } from 'express';
import {
  login,
  logout,
  me,
  signup,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { loginRules, signupRules, validate } from '../middleware/validate.js';

const router = Router();

router.post('/signup', signupRules, validate, signup);
router.post('/login', loginRules, validate, login);
router.get('/me', requireAuth, me);
router.post('/logout', logout);

export default router;
