import { Router } from 'express';
import {
  handleShortCodeClick,
  handleTrackingClick,
} from '../controllers/trackingController.js';

const router = Router();

// Public routes — no JWT. Hit directly from WhatsApp / browser.

// Legacy long-format route: /t/:token
router.get('/t/:token', handleTrackingClick);

// New short-code route: /l/:code
router.get('/l/:code', handleShortCodeClick);

export default router;
