import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getProfile, updateProfile, deleteAccount } from "../controllers/profile";

const router = Router();

router.get('/', requireAuth, getProfile);
router.put('/', requireAuth, updateProfile);
router.delete("/", requireAuth, deleteAccount);

export default router;