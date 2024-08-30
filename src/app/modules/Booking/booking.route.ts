import express from 'express';
import { BookingControllers } from './booking.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { BookingValidations } from './booking.validation';

const router = express.Router();

router
  .route('/')
  .get(auth(USER_ROLE.admin), BookingControllers.getAllBooking) // checking if the user role is admin
  .post(
    validateRequest(BookingValidations.createBookingValidationSchema), // validating the schema
    auth(USER_ROLE.user), // checking if the user role is user
    BookingControllers.createABooking,
  );

router
  .route('/my-bookings')
  .get(auth(USER_ROLE.user), BookingControllers.getIndividualBookings);

router
  .route('/my-bookings/:id')
  .delete(auth(USER_ROLE.user), BookingControllers.cancelMyBooking);

router
  .route('/:id')
  .put(auth(USER_ROLE.admin), BookingControllers.updateBookingStatus);

export const BookingRoutes = router;
