import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { BookingServices } from './booking.service';
import sendResponse from '../../utils/sendResponse';

// booking controllers

const createABooking = catchAsync(async (req, res) => {
  const result = await BookingServices.bookingACarFromDB(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Car booked successfully',
    data: result,
  });
});

const getAllBooking = catchAsync(async (req, res) => {
  const result = await BookingServices.getAllBookingFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Bookings retrieved successfully',
    data: result,
  });
});

const getIndividualBookings = catchAsync(async (req, res) => {
  const result = await BookingServices.getIndividualUserBookings(req.user, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My Bookings retrieved successfully',
    data: result,
  });
});

export const BookingControllers = {
  createABooking,
  getAllBooking,
  getIndividualBookings,
};
