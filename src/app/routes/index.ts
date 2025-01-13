import { Router } from 'express';
import { AuthRoutes } from '../modules/Auth/auth.route';
import { CarRoutes } from '../modules/Car/car.route';
import { BookingRoutes } from '../modules/Booking/booking.route';
import { ReviewRoutes } from '../modules/Review/review.route';
import { NewsletterRoutes } from '../modules/Newsletter/newsletter.route';
import { DashboardRoutes } from '../modules/Dashboard/dashboard,route';

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
  {
    path: '/newsletters',
    route: NewsletterRoutes,
  },
  {
    path: '/dashboard',
    route: DashboardRoutes,
  },
];

// lopping through the routes
moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;
