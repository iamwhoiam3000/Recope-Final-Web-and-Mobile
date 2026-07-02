import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getChatHistory, saveChatMessage, clearChatHistory } from '../controllers/chat';

const router = Router();

router.get('/', requireAuth, getChatHistory);
router.post('/', requireAuth, saveChatMessage);
router.delete('/', requireAuth, clearChatHistory);

export default router;