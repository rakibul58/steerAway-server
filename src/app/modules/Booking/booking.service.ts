/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from 'http-status';
import { Car } from '../Car/car.model';
import { ICreateBookingData } from './booking.interface';
import AppError from '../../errors/AppError';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../User/user.model';
import { Booking } from './booking.model';
import mongoose from 'mongoose';

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

const getAllBookingFromDB = async (carId: string, date: string) => {
  const query: { car?: string; date?: string } = {};
  // handling the query
  if (carId?.length) {
    query.car = carId;
  }
  if (date?.length) {
    query.date = date;
  }
  const result = await Booking.find(query).populate('car').populate('user');
  // checking the if there is any data
  if (result.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Data Found');
  }
  return result;
};

const getIndividualUserBookings = async (userData: JwtPayload) => {
  const userResult = await User.findOne({ email: userData.email });
  // checking if the user exists
  if (!userResult) {
    throw new AppError(httpStatus.NOT_FOUND, 'This User is not found');
  }

  const result = await Booking.find({ user: userResult._id })
    .populate('car')
    .populate('user');
  if (result.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Data Found');
  }
  return result;
};

export const BookingServices = {
  bookingACarFromDB,
  getAllBookingFromDB,
  getIndividualUserBookings,
};
