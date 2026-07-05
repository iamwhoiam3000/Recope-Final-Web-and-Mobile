import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { generateRecipe, generateNutrition } from '../controllers/ai';

const router = Router();

router.post('/generate', requireAuth, generateRecipe);
router.post('/nutrition', requireAuth, generateNutrition);

export default router;