import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getReviews, createReview, updateReview, deleteReview } from '../controllers/reviews';

const router = Router();

router.get('/:recipe_id', getReviews);
router.post('/:recipe_id', requireAuth, createReview);
router.put('/:id', requireAuth, updateReview);
router.delete('/:id', requireAuth, deleteReview);

export default router;