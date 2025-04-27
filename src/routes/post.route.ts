import {Router} from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { addPost, deletePost, getAllPosts, getPost, getPostsByProperty, getPostsByType, searchPosts, updatePost } from '../controllers/post.controller';
import {uploadMiddleware} from "../middleware/uplaodMulter";


const upload = uploadMiddleware('posts')

const router = Router();

router.get('/', getAllPosts);

router.get('/:id', getPost);

// Route pour récupérer les posts en fonction de la propriété
router.get("/property/:property", getPostsByProperty);

// Route pour rechercher les posts par texte
router.get("/search/input", searchPosts);

router.get("/type/:type", getPostsByType);


router.post('/', verifyToken, upload.array("img", 15), addPost);


router.put('/:id', verifyToken, upload.array("img", 15), updatePost);

router.delete('/:id', verifyToken, deletePost);



export default router;

