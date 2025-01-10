import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Newsletter } from './newsletter.model';

const getAllNewsletterFromDB = async (query: Record<string, unknown>) => {
  const NewsletterQuery = new QueryBuilder(Newsletter.find(), query)
    .search(['email'])
    .filter()
    .sort()
    .priceRange()
    .paginate()
    .fields();

  const result = await NewsletterQuery.modelQuery;
  const meta = await NewsletterQuery.countTotal();

  // checking if there is any cars
  if (result.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Data Found');
  }
  return { result, meta };
};

const subscribeToNewsletterInDB = async (email: string) => {
  const isExists = await Newsletter.findOne({ email });
  if (isExists) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Already Subscribed to Newsletter',
    );
  }
  return await Newsletter.create({ email });
};

export const NewsletterService = {
  getAllNewsletterFromDB,
  subscribeToNewsletterInDB
};
