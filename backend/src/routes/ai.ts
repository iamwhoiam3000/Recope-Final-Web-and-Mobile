import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { generateRecipe } from '../controllers/ai';

const router = Router();

router.post('/generate', requireAuth, generateRecipe);

export default router;