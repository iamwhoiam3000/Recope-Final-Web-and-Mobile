import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  generateRecipe,
  generateNutrition,
  generateSubstitutions,
} from '../controllers/ai';

const router = Router();

router.post('/generate', requireAuth, generateRecipe);
router.post('/nutrition', requireAuth, generateNutrition);
router.post('/substitutions', requireAuth, generateSubstitutions);

export default router;