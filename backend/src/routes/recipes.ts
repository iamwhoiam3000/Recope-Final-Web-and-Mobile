import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getMyRecipes,
} from '../controllers/recipes';

const router = Router();

router.get('/', getRecipes);
router.get('/my', requireAuth, getMyRecipes);
router.get('/:id', getRecipe);
router.post('/', requireAuth, createRecipe);
router.put('/:id', requireAuth, updateRecipe);
router.delete('/:id', requireAuth, deleteRecipe);

export default router;