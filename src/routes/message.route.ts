import {Router} from 'express';
import { addMessage } from '../controllers/message.controller';
import { verifyToken } from '../middleware/verifyToken';


const router = Router();

router.post('/:chatId', verifyToken, addMessage);






export default router;

