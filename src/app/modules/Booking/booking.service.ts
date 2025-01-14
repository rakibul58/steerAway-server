/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { Car } from '../Car/car.model';
import { ICreateBookingData, VerifyBookingQuery } from './booking.interface';
import AppError from '../../errors/AppError';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../User/user.model';
import { Booking } from './booking.model';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import { initiatePayment, verifyPayment } from './booking.utlis';
import { IUser } from '../User/user.interface';
import { join } from 'path';
import { readFileSync } from 'fs';
import crypto from 'crypto';

const calculateCosts = (
  car: any,
  duration: 'hourly' | 'daily' | 'weekly' | 'monthly',
  features: any,
) => {
  const baseCost =
    {
      hourly: car.pricing.hourlyRate,
      daily: car.pricing.dailyRate,
      weekly: car.pricing.weeklyRate,
      monthly: car.pricing.monthlyRate,
    }[duration] || car.pricing.basePrice;

  const additionalCosts = {
    insuranceCost: features.insurance ? car.pricing.insurancePrice : 0,
    gpsCost: features.gps ? car.pricing.gpsPrice : 0,
    childSeatCost: features.childSeat ? car.pricing.childSeatPrice : 0,
  };

  return {
    baseCost,
    additionalCosts,
    totalCost:
      baseCost + Object.values(additionalCosts).reduce((a, b) => a + b, 0),
  };
};

const bookingACarFromDB = async (
  userData: JwtPayload,
  payload: ICreateBookingData,
) => {
  const car = await Car.isCarExists(payload.carId);
  if (!car || car.status === 'booked') {
    throw new AppError(
      httpStatus.NOT_FOUND,
      car ? 'Car is unavailable' : 'Car not found',
    );
  }

  const user = await User.findOne({ email: userData.email });
  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found or deleted');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const updatedCar = await Car.findByIdAndUpdate(
      payload.carId,
      { status: 'booked' },
      { new: true, session },
    );

    const costs = calculateCosts(
      car,
      payload.duration,
      payload.additionalFeatures,
    );
    const booking = await Booking.create(
      [
        {
          ...payload,
          car: payload.carId,
          user: user._id,
          ...costs,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return { ...booking[0].toObject(), car: updatedCar, user };
  } catch (err) {
    await session.abortTransaction();
    throw new Error('Failed To Book');
  } finally {
    await session.endSession();
  }
};

const getAllBookingFromDB = async (query: Record<string, unknown>) => {
  const bookingQuery = new QueryBuilder(
    Booking.find().populate('car').populate('user'),
    query,
  )
    .search(['status', 'paymentStatus'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [result, meta] = await Promise.all([
    bookingQuery.modelQuery,
    bookingQuery.countTotal(),
  ]);

  if (!result.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'No bookings found');
  }
  return { result, meta };
};

const getIndividualUserBookings = async (
  userData: JwtPayload,
  query: Record<string, unknown>,
) => {
  const user = await User.findOne({ email: userData.email });
  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found or deleted');
  }

  const bookingQuery = new QueryBuilder(
    Booking.find({ user: user._id }).populate('car').populate('user'),
    query,
  )
    .search(['status', 'paymentStatus'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [result, meta] = await Promise.all([
    bookingQuery.modelQuery,
    bookingQuery.countTotal(),
  ]);

  if (!result.length) {
    throw new AppError(httpStatus.NOT_FOUND, 'No bookings found');
  }
  return { result, meta };
};

const updateBookingStatusInDB = async (
  bookingId: string,
  payload: { status: string },
) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const updatedCar = await Car.findByIdAndUpdate(
      booking.car,
      { status: payload.status === 'Approved' ? 'booked' : 'available' },
      { new: true, session },
    );

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: payload.status === 'Approved' ? 'Approved' : 'Cancelled' },
      { new: true, session },
    );

    await session.commitTransaction();
    return { car: updatedCar, booking: updatedBooking };
  } catch (err) {
    await session.abortTransaction();
    throw new Error('Failed To Update');
  } finally {
    await session.endSession();
  }
};

const cancelMyBookingInDB = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  if (booking.status === 'Approved') {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Approved booking cannot be cancelled',
    );
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const [updatedCar, updatedBooking] = await Promise.all([
      Car.findByIdAndUpdate(
        booking.car,
        { status: 'available' },
        { new: true, session },
      ),
      Booking.findByIdAndUpdate(
        bookingId,
        { status: 'Cancelled' },
        { new: true, session },
      ),
    ]);

    await session.commitTransaction();
    return { car: updatedCar, booking: updatedBooking };
  } catch (err) {
    await session.abortTransaction();
    throw new Error('Failed to Cancel');
  } finally {
    await session.endSession();
  }
};

const paymentBookingIntoDB = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId);
  const user = (await User.findById(booking?.user)) as IUser;

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, 'Booking not found');
  }
  if (booking.status !== 'Returned') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Car not returned yet');
  }

  await Booking.findByIdAndUpdate(bookingId, {
    transactionId: `TXN-${crypto.randomBytes(8).toString('hex')}`,
  });

  const paymentData = {
    transactionId: `TXN-${booking._id}-${new Date().getTime()}`,
    totalPrice: booking.totalCost,
    customerName: user.name,
    customerEmail: user.email,
    customerPhone: user.phone,
    customerAddress: user.address,
    bookingId: booking._id,
  };

  return await initiatePayment(paymentData);
};

const verifyBookingPaymentInDB = async (query: VerifyBookingQuery) => {
  return await mongoose.connection.transaction(async session => {
    const verifyResponse = await verifyPayment(query.transactionId);
    let filePath;

    console.log({ verifyResponse });

    if (query.status === 'success') {
      await Booking.findByIdAndUpdate(
        query.bookingId,
        {
          transactionId: query.transactionId,
          paymentStatus: 'Paid',
          paidAt: new Date().toISOString(),
        },
        { session },
      );

      filePath = join(__dirname, '../../views/booking-success.html');
    } else {
      await Booking.findByIdAndUpdate(
        query.bookingId,
        { status: 'CANCELLED' },
        { session },
      );
      filePath = join(__dirname, '../../views/booking-failed.html');
    }

    const template = readFileSync(filePath, 'utf-8');
    return template
      .replace('{{transactionId}}', query.transactionId)
      .replace('{{name}}', query.customerName)
      .replace('{{amount}}', query.totalPrice);
  });
};

export const BookingServices = {
  bookingACarFromDB,
  getAllBookingFromDB,
  getIndividualUserBookings,
  updateBookingStatusInDB,
  cancelMyBookingInDB,
  paymentBookingIntoDB,
  verifyBookingPaymentInDB,
};
