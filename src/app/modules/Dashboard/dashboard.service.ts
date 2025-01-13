/* eslint-disable @typescript-eslint/no-explicit-any */
import { Booking } from '../Booking/booking.model';
import { Car } from '../Car/car.model';

const getAdminDashboard = async () => {
  const today = new Date();
  const lastMonth = new Date(today.setMonth(today.getMonth() - 1));

  const [bookings, cars, recentBookings] = await Promise.all([
    Booking.find({
      createdAt: { $gte: lastMonth },
    }).populate('car'),
    Car.find(),
    Booking.find({
      status: { $in: ['Pending', 'Approved'] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('car'),
  ]);

  const overview = {
    totalRevenue: bookings
      .filter(b => b.paymentStatus === 'Paid')
      .reduce((sum, booking) => sum + booking.totalCost, 0),
    activeBookings: bookings.filter(b => b.status === 'Approved' && !b.endTime)
      .length,
    availableCars: cars.filter(c => c.status === 'available' && !c.isDeleted)
      .length,
    pendingApprovals: bookings.filter(
      b => b.status === 'Pending' && b.paymentStatus === 'Pending',
    ).length,
  };

  return {
    overview,
    revenueStats: {
      daily: await calculateDailyRevenue(bookings),
      monthly: await calculateMonthlyRevenue(bookings),
    },
    bookingStats: {
      timeline: await calculateBookingTimeline(bookings),
      byStatus: await calculateBookingsByStatus(bookings),
      byPaymentStatus: await calculateBookingsByPaymentStatus(bookings),
    },
    recentBookings: recentBookings.map(booking => ({
      id: booking._id,
      car: (booking.car as any).name,
      date: booking.date,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      totalCost: booking.totalCost,
    })),
  };
};

const getUserStats = async (email: string) => {
  const today = new Date();
  const lastMonth = new Date(today.setMonth(today.getMonth() - 1));

  const userBookings = await Booking.find({
    email: email,
    createdAt: { $gte: lastMonth },
  }).populate({ path: 'car', model: Car, select: 'name pricing' });

  const activeRentals = userBookings
    .filter(b => b.status === 'Approved' && !b.endTime)
    .map(b => ({
      id: b._id,
      car: (b.car as any).name,
      returnDate: b.endTime || 'N/A',
      cost: b.totalCost,
      paymentStatus: b.paymentStatus,
      additionalFeatures: b.additionalFeatures,
    }));

  const upcomingBookings = userBookings
    .filter(b => b.status === 'Pending')
    .map(b => ({
      id: b._id,
      car: (b.car as any).name,
      startDate: b.date,
      cost: b.totalCost,
      paymentStatus: b.paymentStatus,
      additionalFeatures: b.additionalFeatures,
    }));

  const paidBookings = userBookings.filter(b => b.paymentStatus === 'Paid');

  return {
    overview: {
      totalSpent: paidBookings.reduce((sum, b) => sum + b.totalCost, 0),
      activeBookings: activeRentals.length,
      completedBookings: userBookings.filter(b => b.status === 'Returned')
        .length,
      pendingPayments: userBookings.filter(b => b.paymentStatus === 'Pending')
        .length,
    },
    revenueStats: {
      daily: await calculateDailyRevenue(paidBookings),
      monthly: await calculateMonthlyRevenue(paidBookings),
    },
    bookingStats: {
      timeline: await calculateBookingTimeline(userBookings),
      byStatus: await calculateBookingsByStatus(userBookings),
      byPaymentStatus: await calculateBookingsByPaymentStatus(userBookings),
    },
    userStats: {
      activeRentals,
      upcomingBookings,
      spending: {
        total: paidBookings.reduce((sum, b) => sum + b.totalCost, 0),
        byType: calculateSpendingByType(paidBookings),
        monthly: await calculateMonthlyRevenue(paidBookings),
      },
    },
  };
};

const calculateDailyRevenue = async (bookings: any[]) => {
  const paidBookings = bookings.filter(b => b.paymentStatus === 'Paid');
  const dailyRevenue = paidBookings.reduce(
    (acc, booking) => {
      const date = new Date(booking.date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + booking.totalCost;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(dailyRevenue)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, amount]) => ({
      date,
      amount,
    }));
};

const calculateMonthlyRevenue = async (bookings: any[]) => {
  const paidBookings = bookings.filter(b => b.paymentStatus === 'Paid');
  const monthlyRevenue = paidBookings.reduce(
    (acc, booking) => {
      const month = new Date(booking.date).toLocaleDateString('default', {
        month: 'short',
      });
      acc[month] = (acc[month] || 0) + booking.totalCost;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(monthlyRevenue).map(([month, amount]) => ({
    month,
    amount,
  }));
};

const calculateBookingTimeline = async (bookings: any[]) => {
  const timeline = bookings.reduce(
    (acc, booking) => {
      const date = new Date(booking.date).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(timeline)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, count]) => ({
      date,
      count,
    }));
};

const calculateBookingsByStatus = async (bookings: any[]) => {
  return bookings.reduce(
    (acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
};

const calculateBookingsByPaymentStatus = async (bookings: any[]) => {
  return bookings.reduce(
    (acc, booking) => {
      acc[booking.paymentStatus] =
        booking.status !== 'Returned' && (acc[booking.paymentStatus] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
};

const calculateSpendingByType = (bookings: any[]) => {
  return bookings.reduce(
    (acc, booking) => {
      acc.baseCosts += booking.baseCost;
      acc.insuranceCosts += booking.additionalCosts.insuranceCost;
      acc.gpsCosts += booking.additionalCosts.gpsCost;
      acc.childSeatCosts += booking.additionalCosts.childSeatCost;
      return acc;
    },
    {
      baseCosts: 0,
      insuranceCosts: 0,
      gpsCosts: 0,
      childSeatCosts: 0,
    },
  );
};

export const DashboardService = {
  getAdminDashboard,
  getUserStats,
};
