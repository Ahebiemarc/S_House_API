import { deleteUser, getUser, getUsers, updateUser } from '../controllers/user.controller';
import {Router} from 'express';
import { isAdmin } from '../middleware/isAdmin';
import { verifyToken } from '../middleware/verifyToken';
import {uploadMiddleware} from "../middleware/uplaodMulter";


const upload = uploadMiddleware('avatars')




const router = Router();

router.get('/', verifyToken, isAdmin,  getUsers);

router.get('/me', verifyToken, getUser)

router.put('/:id', verifyToken, upload.single('avatar'), updateUser);

router.delete('/:id', verifyToken, deleteUser);




export default router;

