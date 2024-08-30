import { IReview } from './review.interface';
import { Review } from './review.model';

const createReviewInDB = async (reviewData: IReview) => {
  const review = new Review(reviewData);
  await review.save();
  return review;
};

const getReviewsByCarIdFromDB = async (id: string) => {
  return await Review.find({car: id}).populate('user').populate('car');
};

export const ReviewServices = {
  createReviewInDB,
  getReviewsByCarIdFromDB,
};
