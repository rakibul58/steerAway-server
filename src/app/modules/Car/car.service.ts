/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { ICar, IReturnCarBooking } from './car.interface';
import { Car } from './car.model';
import { Booking } from '../Booking/booking.model';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';

// creating a car in the db
const createCarIntoDB = async (payload: ICar) => {
  const result = await Car.create(payload);
  return result;
};

const getAllCarsFromDB = async (query: Record<string, unknown>) => {
  // Basic query setup
  const CarQuery = new QueryBuilder(Car.find(), query)
    .search(['name', 'brand', 'model', 'color'])
    .filter()
    .filterByStatus()
    .filterBySpecifications()
    .filterByRating()
    .filterByPriceRange('dailyRate')
    .sort()
    .paginate()
    .fields();

  const [result, meta, aggregations] = await Promise.all([
    CarQuery.modelQuery,
    CarQuery.countTotal(),
    getCarAggregations(query),
  ]);

  if (result.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Cars Found');
  }

  return {
    result,
    meta,
    aggregations,
  };
};

const getCarAggregations = async (query: Record<string, unknown>) => {
  const matchStage: Record<string, unknown> = { isDeleted: false };

  if (query.status) {
    matchStage.status = query.status;
  }

  const [brandStats, priceStats, ratingStats] = await Promise.all([
    Car.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { brand: '$brand', model: '$model' },
          count: { $sum: 1 },
          avgPrice: { $avg: '$pricing.dailyRate' },
        },
      },
      {
        $group: {
          _id: '$_id.brand',
          models: {
            $push: {
              name: '$_id.model',
              count: '$count',
              avgPrice: '$avgPrice',
            },
          },
          totalCars: { $sum: '$count' },
        },
      },
      { $sort: { totalCars: -1 } },
    ]),

    Car.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          minDailyRate: { $min: '$pricing.dailyRate' },
          maxDailyRate: { $max: '$pricing.dailyRate' },
          avgDailyRate: { $avg: '$pricing.dailyRate' },
          minHourlyRate: { $min: '$pricing.hourlyRate' },
          maxHourlyRate: { $max: '$pricing.hourlyRate' },
          avgHourlyRate: { $avg: '$pricing.hourlyRate' },
        },
      },
    ]),

    Car.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$ratingStats.averageRating' },
          totalRatings: { $sum: '$ratingStats.totalRatings' },
          ratingDistribution: { $first: '$ratingStats.ratingDistribution' },
        },
      },
    ]),
  ]);

  return {
    brands: brandStats,
    pricing: priceStats[0] || null,
    ratings: ratingStats[0] || null,
  };
};

// get single car
const getSingleCarFromDB = async (id: string) => {
  const result = await Car.isCarExists(id);
  // checking if the car exists
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Data Found');
  }
  return result;
};

const getRelatedCarsFromDB = async (id: string) => {
  const result = await Car.find({
    _id: { $ne: id },
  }).limit(4);
  return result;
};

// update a car
const updateACarInDB = async (id: string, payload: Partial<ICar>) => {
  const result = await Car.isCarExists(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Data Found');
  }
  const updatedCar = await Car.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updatedCar;
};

// deleting a car
const deleteACarFromDB = async (id: string) => {
  const result = await Car.isCarExists(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Data Found');
  }
  const deletedCar = await Car.findByIdAndUpdate(
    id,
    { isDeleted: true },
    {
      new: true,
      runValidators: true,
    },
  );

  return deletedCar;
};

const normalizeTimeString = (time: string): string => {
  // Ensure time is in HH:mm format
  const [hours, minutes] = time.split(':').map(Number);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const calculateDuration = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): { days: number; hours: number } => {
  try {
    // Normalize time strings
    const normalizedStartTime = normalizeTimeString(startTime);
    const normalizedEndTime = normalizeTimeString(endTime);

    const startDateTime = new Date(`${startDate}T${normalizedStartTime}:00`);
    const endDateTime = new Date(`${endDate}T${normalizedEndTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid date/time format');
    }

    const diffInMs = endDateTime.getTime() - startDateTime.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    const days = Math.floor(diffInHours / 24);
    const remainingHours = Math.ceil(diffInHours % 24);

    return {
      days: Math.max(0, days),
      hours: Math.max(0, remainingHours),
    };
  } catch (error) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Error calculating duration. Please check date and time formats.',
    );
  }
};

const calculateRentingCost = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  duration: string,
  pricing: any,
): number => {
  if (!pricing) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid pricing configuration');
  }

  // Validate pricing values
  const {
    hourlyRate = 0,
    dailyRate = 0,
    weeklyRate = 0,
    monthlyRate = 0,
  } = pricing;

  if (
    isNaN(hourlyRate) ||
    isNaN(dailyRate) ||
    isNaN(weeklyRate) ||
    isNaN(monthlyRate)
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid pricing rates');
  }

  const { days, hours } = calculateDuration(
    startDate,
    startTime,
    endDate,
    endTime,
  );
  let cost = 0;

  switch (duration) {
    case 'hourly': {
      const totalHours = Math.max(1, days * 24 + hours);
      cost = totalHours * hourlyRate;
      break;
    }
    case 'daily': {
      const totalDays = Math.max(1, hours > 0 ? days + 1 : days);
      cost = totalDays * dailyRate;
      break;
    }
    case 'weekly': {
      const totalDays = hours > 0 ? days + 1 : days;
      const weeks = Math.max(1, Math.ceil(totalDays / 7));
      cost = weeks * weeklyRate;
      break;
    }
    case 'monthly': {
      const totalDays = hours > 0 ? days + 1 : days;
      const months = Math.max(1, Math.ceil(totalDays / 30));
      cost = months * monthlyRate;
      break;
    }
    default:
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid duration type');
  }

  // Final validation to ensure cost is a valid number
  if (isNaN(cost) || cost < 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Error calculating rental cost. Please check pricing configuration.',
    );
  }

  return cost;
};

const calculateAdditionalCosts = (
  bookingData: any,
  carPricing: any,
): { insuranceCost: number; childSeatCost: number; gpsCost: number } => {
  // Default all prices to 0 if not found
  const insurancePrice = carPricing?.insurancePrice ?? 0;
  const childSeatPrice = carPricing?.childSeatPrice ?? 0;
  const gpsPrice = carPricing?.gpsPrice ?? 0;

  // Ensure all prices are valid numbers
  if (isNaN(insurancePrice) || isNaN(childSeatPrice) || isNaN(gpsPrice)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Invalid additional cost configuration',
    );
  }

  return {
    insuranceCost: bookingData.additionalFeatures?.insurance
      ? insurancePrice
      : 0,
    childSeatCost: bookingData.additionalFeatures?.childSeat
      ? childSeatPrice
      : 0,
    gpsCost: bookingData.additionalFeatures?.gps ? gpsPrice : 0,
  };
};

const returnCarUpdateInDB = async (payload: IReturnCarBooking) => {
  // Fetch booking with related car data
  const bookingData = await Booking.findById(payload.bookingId)
    .populate('car')
    .lean();

  if (!bookingData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  const carData = bookingData.car as any;
  if (!carData) {
    throw new AppError(httpStatus.NOT_FOUND, 'Car not found');
  }

  if (!carData.pricing) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Car pricing configuration not found',
    );
  }

  // Validate booking status
  if (bookingData.status === 'Returned') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Car has already been returned');
  }

  if (bookingData.status === 'Cancelled') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Cannot return a cancelled booking',
    );
  }

  if (!bookingData.duration) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Booking duration type not specified',
    );
  }

  // Calculate costs with additional error handling
  let rentingCost = 0;
  let additionalCosts = { insuranceCost: 0, childSeatCost: 0, gpsCost: 0 };
  let totalCost = 0;

  try {
    rentingCost = calculateRentingCost(
      bookingData.date,
      bookingData.startTime,
      payload.endDate,
      payload.endTime,
      bookingData.duration,
      carData.pricing,
    );

    additionalCosts = calculateAdditionalCosts(bookingData, carData.pricing);

    totalCost =
      rentingCost +
      additionalCosts.insuranceCost +
      additionalCosts.childSeatCost +
      additionalCosts.gpsCost;

    // Final validation of total cost
    if (isNaN(totalCost) || totalCost < 0) {
      throw new Error('Invalid total cost calculated');
    }
  } catch (error) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Error calculating costs. Please check pricing configuration.',
    );
  }

  // Start transaction
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Update car status
    await Car.findByIdAndUpdate(
      carData._id,
      { status: 'available' },
      { session, new: true },
    );

    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      payload.bookingId,
      {
        endDate: payload.endDate,
        endTime: payload.endTime,
        rentingCost,
        insuranceCost: additionalCosts.insuranceCost,
        childSeatCost: additionalCosts.childSeatCost,
        gpsCost: additionalCosts.gpsCost,
        totalCost,
        status: 'Returned',
      },
      {
        session,
        new: true,
        runValidators: true,
      },
    ).populate(['user', 'car']);

    await session.commitTransaction();
    return updatedBooking;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const getCarCategoriesFromDB = async () => {
  const brandsWithModels = await Car.aggregate([
    {
      $match: {
        isDeleted: false,
        status: 'available',
      },
    },
    {
      $group: {
        _id: '$brand',
        models: { $addToSet: '$model' },
        totalCars: { $sum: 1 },
        minPrice: { $min: '$pricing.dailyRate' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  // Get featured cars (newest additions)
  const featuredCars = await Car.find({
    isDeleted: false,
    status: 'available',
  })
    .select('name brand model images pricing.dailyRate')
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  // Get popular car types
  const carTypes = await Car.aggregate([
    {
      $match: {
        isDeleted: false,
        status: 'available',
      },
    },
    {
      $group: {
        _id: '$specifications.fuelType',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return {
    brands: brandsWithModels.map(brand => ({
      name: brand._id,
      models: brand.models,
      totalCars: brand.totalCars,
      minPrice: brand.minPrice,
    })),
    featuredCars: featuredCars.map(car => ({
      id: car._id,
      name: car.name,
      brand: car.brand,
      model: car.model,
      image: car.images[0],
      dailyRate: car.pricing.dailyRate,
      slug: `${car.brand.toLowerCase()}-${car.model.toLowerCase()}`.replace(
        / /g,
        '-',
      ),
    })),
    carTypes: carTypes.map(type => ({
      type: type._id,
      count: type.count,
    })),
  };
};

export const CarServices = {
  createCarIntoDB,
  getAllCarsFromDB,
  getSingleCarFromDB,
  updateACarInDB,
  deleteACarFromDB,
  returnCarUpdateInDB,
  getCarCategoriesFromDB,
  getRelatedCarsFromDB,
};
