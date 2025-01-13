import { Router } from 'express';
import { USER_ROLE } from '../User/user.constant';
import auth from '../../middlewares/auth';
import { DashboardController } from './dashboard.controller';

const router = Router();

router
  .route('/user')
  .get(auth(USER_ROLE.user), DashboardController.getUserDashboard);

router
  .route('/admin')
  .get(auth(USER_ROLE.admin), DashboardController.getAdminDashboard);

export const DashboardRoutes = router;
