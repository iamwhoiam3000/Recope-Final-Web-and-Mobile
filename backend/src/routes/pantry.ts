import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getPantry, addPantryItem, deletePantryItem, matchRecipes, updatePantryItem } from '../controllers/pantry';

const router = Router();

router.get('/match', requireAuth, matchRecipes);
router.get('/', requireAuth, getPantry);
router.post('/', requireAuth, addPantryItem);
router.delete('/:id', requireAuth, deletePantryItem);
router.put('/:id', requireAuth, updatePantryItem);

export default router;