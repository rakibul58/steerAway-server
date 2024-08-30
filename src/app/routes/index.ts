import { Router } from 'express';
import { AuthRoutes } from '../modules/Auth/auth.route';
import { CarRoutes } from '../modules/Car/car.route';
import { BookingRoutes } from '../modules/Booking/booking.route';
import { ReviewRoutes } from '../modules/Review/review.route';

const router = Router();

// All the routes in the project
const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/cars',
    route: CarRoutes,
  },
  {
    path: '/bookings',
    route: BookingRoutes,
  },
  {
    path: '/reviews',
    route: ReviewRoutes,
  },
];

// lopping through the routes
moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
