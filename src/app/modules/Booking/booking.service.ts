/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from 'http-status';
import { Car } from '../Car/car.model';
import { IBooking, ICreateBookingData } from './booking.interface';
import AppError from '../../errors/AppError';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../User/user.model';
import { Booking } from './booking.model';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';

// booking a car
const bookingACarFromDB = async (
  userData: JwtPayload,
  payload: ICreateBookingData,
) => {
  // checking a car exists
  const carResult = await Car.isCarExists(payload.carId);
  if (!carResult) {
    throw new AppError(httpStatus.NOT_FOUND, 'This car not found');
  }
  // checking if the car is unavailable
  if (carResult.status === 'unavailable') {
    throw new AppError(httpStatus.BAD_REQUEST, 'This car is unavailable');
  }
  // checking user exists
  const userResult = await User.findOne({ email: userData.email });
  if (!userResult) {
    throw new AppError(httpStatus.NOT_FOUND, 'This User is not found');
  }

  const isDeleted = userResult?.isDeleted;

  if (isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted!');
  }

  // starting mongoose session
  const session = await mongoose.startSession();

  try {
    // starting transaction
    session.startTransaction();
    // updating the car with status unavailable
    const updatedCar = await Car.findByIdAndUpdate(
      payload.carId,
      {
        status: 'unavailable',
      },
      {
        runValidators: true,
        new: true,
        session,
      },
    );
    // creating the booking
    const bookedCar = await Booking.create(
      [
        {
          date: payload.date,
          car: payload.carId,
          user: userResult._id,
          startTime: payload.startTime,
          additionalFeatures: payload.additionalFeatures,
          nidOrPassport: payload.nidOrPassport,
          drivingLicense: payload.drivingLicense,
        },
      ],
      { session },
    );

    // ending and committing session
    await session.commitTransaction();
    await session.endSession();

    // formatting the response data
    const { car, user, ...bookedCarWithoutCarAndUser } =
      bookedCar[0].toObject();
    return { ...bookedCarWithoutCarAndUser, car: updatedCar, user: userResult };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    // handling if there is an error
    await session.abortTransaction();
    await session.endSession();
    throw new Error(err);
  }
};

const getAllBookingFromDB = async (query: Record<string, unknown>) => {
  const BookingQuery = new QueryBuilder(
    Booking.find().populate('car').populate('user'),
    query,
  )
    .search([])
    .filter()
    .sort()
    .priceRange()
    .paginate()
    .fields();

  const result = await BookingQuery.modelQuery;
  const meta = await BookingQuery.countTotal();

  // checking if there is any cars
  if (result.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Data Found');
  }
  return { result, meta };
};

const getIndividualUserBookings = async (
  userData: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userResult = await User.findOne({ email: userData.email });
  // checking if the user exists
  if (!userResult) {
    throw new AppError(httpStatus.NOT_FOUND, 'This User is not found');
  }

  const isDeleted = userResult?.isDeleted;

  if (isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This user is deleted!');
  }

  const BookingQuery = new QueryBuilder(
    Booking.find({ user: userResult._id })
      .populate('car')
      .populate('user')
      .sort('-createdAt'),
    query,
  )
    .search([])
    .filter()
    .sort()
    .priceRange()
    .paginate()
    .fields();

  const result = await BookingQuery.modelQuery;
  const meta = await BookingQuery.countTotal();

  // checking if there is any cars
  if (result.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Data Found');
  }
  return { result, meta };
};

// booking status update
const updateBookingStatusInDB = async (
  bookingId: string,
  payload: { status: string },
) => {
  const booking = (await Booking.findById(bookingId)) as IBooking;
  // starting mongoose session
  const session = await mongoose.startSession();

  try {
    // starting transaction
    session.startTransaction();
    // updating the car with status unavailable
    const updatedCar = await Car.findByIdAndUpdate(
      booking.car,
      {
        status: payload.status == 'Approved' ? 'unavailable' : 'available',
      },
      {
        runValidators: true,
        new: true,
        session,
      },
    );
    // creating the booking
    const bookedCar = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: payload.status == 'Approved' ? 'Approved' : 'Cancelled',
      },
      {
        runValidators: true,
        new: true,
        session,
      },
    );

    // ending and committing session
    await session.commitTransaction();
    await session.endSession();

    return { car: updatedCar, booking: bookedCar };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    // handling if there is an error
    await session.abortTransaction();
    await session.endSession();
    throw new Error(err);
  }
};

//cancel user booking
const cancelMyBookingInDB = async (bookingId: string) => {
  const booking = (await Booking.findById(bookingId)) as IBooking;
  // starting mongoose session
  const session = await mongoose.startSession();

  if (booking.status === 'Approved') {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Approved Booking can not be Cancelled!!',
    );
  }

  try {
    // starting transaction
    session.startTransaction();
    // updating the car with status unavailable
    const updatedCar = await Car.findByIdAndUpdate(
      booking.car,
      {
        status: 'available',
      },
      {
        runValidators: true,
        new: true,
        session,
      },
    );
    // creating the booking
    const bookedCar = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'Cancelled',
      },
      {
        runValidators: true,
        new: true,
        session,
      },
    );

    // ending and committing session
    await session.commitTransaction();
    await session.endSession();

    return { car: updatedCar, booking: bookedCar };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    // handling if there is an error
    await session.abortTransaction();
    await session.endSession();
    throw new Error(err);
  }
};

export const BookingServices = {
  bookingACarFromDB,
  getAllBookingFromDB,
  getIndividualUserBookings,
  updateBookingStatusInDB,
  cancelMyBookingInDB,
};
