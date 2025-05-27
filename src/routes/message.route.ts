//routes/message.route.ts

import {Router} from 'express';
import { addMessage, deleteMessage, updateMessage } from '../controllers/message.controller';
import { verifyToken } from '../middleware/verifyToken';


const router = Router();

router.post('/:chatId', verifyToken, addMessage);
router.put("/:id", verifyToken, updateMessage);
router.delete("/:id", verifyToken, deleteMessage);







export default router;

