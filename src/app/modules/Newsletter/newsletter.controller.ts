import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { NewsletterService } from './newsletter.service';

const getNewsletter = catchAsync(async (req, res) => {
  const result = await NewsletterService.getAllNewsletterFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Newsletter retrieved successfully',
    data: result,
  });
});

const subscribeToNewsletter = catchAsync(async (req, res) => {
  const result = await NewsletterService.subscribeToNewsletterInDB(
    req.params.email,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Newsletter subscribed successfully',
    data: result,
  });
});

export const NewsletterControllers = {
  getNewsletter,
  subscribeToNewsletter,
};
