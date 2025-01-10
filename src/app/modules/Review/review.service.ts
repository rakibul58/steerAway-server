import mongoose from 'mongoose';
import { IReview } from './review.interface';
import { Review } from './review.model';
import { Car } from '../Car/car.model';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { User } from '../User/user.model';

const createReviewInDB = async (reviewData: IReview): Promise<IReview> => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Check if car exists
    const car = await Car.findById(reviewData.car).session(session);
    if (!car) {
      throw new AppError(httpStatus.NOT_FOUND, 'Car not found');
    }

    // Check if user exists
    const user = await User.findById(reviewData.user).session(session);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Check if user has already reviewed this car
    const existingReview = await Review.findOne({
      car: reviewData.car,
      user: reviewData.user,
    }).session(session);
    if (existingReview) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You have already reviewed this car',
      );
    }

    // Create the review
    const review = await Review.create([reviewData], { session });

    // Get current distribution and update the specific rating
    const currentDistribution = { ...car.ratingStats.ratingDistribution };
    currentDistribution[
      reviewData.rating as keyof typeof currentDistribution
    ]++;

    // Calculate new average
    const newTotalRatings = car.ratingStats.totalRatings + 1;
    const newAverageRating = Number(
      (
        (car.ratingStats.averageRating * car.ratingStats.totalRatings +
          reviewData.rating) /
        newTotalRatings
      ).toFixed(1),
    );

    // Update car's rating statistics while preserving existing distribution
    await Car.findByIdAndUpdate(
      reviewData.car,
      {
        $set: {
          'ratingStats.ratingDistribution': currentDistribution,
          'ratingStats.totalRatings': newTotalRatings,
          'ratingStats.averageRating': newAverageRating,
        },
      },
      { session },
    );

    await session.commitTransaction();
    return review[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getReviewsByCarIdFromDB = async (carId: string): Promise<IReview[]> => {
  const reviews = await Review.find({ car: carId })
    .populate({
      path: 'user',
      select: 'name email image',
    })
    .sort({ createdAt: -1 });

  return reviews;
};

export const ReviewServices = {
  createReviewInDB,
  getReviewsByCarIdFromDB,
};
