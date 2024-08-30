import express from 'express';
import { ReviewControllers } from './review.controller';

const router = express.Router();

router.post('/', ReviewControllers.createReview);
router.get('/car/:id', ReviewControllers.getReviewByCarId);

export const ReviewRoutes = router;
