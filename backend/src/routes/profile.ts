import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getProfile, updateProfile } from '../controllers/profile';

const router = Router();

router.get('/', requireAuth, getProfile);
router.put('/', requireAuth, updateProfile);

export default router;