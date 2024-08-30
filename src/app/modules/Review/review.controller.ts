import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ReviewServices } from './review.service';

const createReview = catchAsync(async (req, res) => {
  const result = await ReviewServices.createReviewInDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review Added Successfully',
    data: result,
  });
});

const getReviewByCarId = catchAsync(async (req, res) => {
  const result = await ReviewServices.getReviewsByCarIdFromDB(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Review Fetched Successfully',
    data: result,
  });
});

export const ReviewControllers = { createReview, getReviewByCarId };
