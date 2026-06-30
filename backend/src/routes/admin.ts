import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { getAnalytics } from '../controllers/admin';

const router = Router();

router.get('/analytics', requireAuth, requireAdmin, getAnalytics);

export default router;