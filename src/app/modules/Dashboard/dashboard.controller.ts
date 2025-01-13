import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import { DashboardService } from './dashboard.service';
import sendResponse from '../../utils/sendResponse';

const getAdminDashboard = catchAsync(async (req, res) => {
  const result = await DashboardService.getAdminDashboard();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin Dashboard retrieved successfully',
    data: result,
  });
});

const getUserDashboard = catchAsync(async (req, res) => {
  const result = await DashboardService.getUserStats(req?.user?.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User Dashboard retrieved successfully',
    data: result,
  });
});

export const DashboardController = {
  getAdminDashboard,
  getUserDashboard,
};
