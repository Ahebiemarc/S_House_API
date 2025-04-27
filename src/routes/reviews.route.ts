
import {Router} from 'express';
import { verifyToken } from '../middleware/verifyToken';
import { isAdmin } from '../middleware/isAdmin';
import { addReview, deleteReview, getAllReviewByPosts, getAllReviewByUser, getAllReviews, getReview, updateReview } from '../controllers/review.controller';



const router = Router();

router.get('/', verifyToken, isAdmin, getAllReviews);

router.get('/:id', getReview);

router.get("/post/:id", getAllReviewByPosts);

router.get("/user", verifyToken, getAllReviewByUser);

router.post('/:id', verifyToken,  addReview);

router.put('/:id', verifyToken, updateReview);

router.delete('/:id', verifyToken, deleteReview);



export default router;