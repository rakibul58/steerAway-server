export interface DashboardResponse {
  overview: {
    totalRevenue: number;
    activeBookings: number;
    availableCars: number;
    pendingApprovals: number;
  };
  revenueStats: {
    daily: Array<{ date: string; amount: number }>;
    monthly: Array<{ month: string; amount: number }>;
  };
  bookingStats: {
    timeline: Array<{ date: string; count: number }>;
    byStatus: Record<string, number>;
  };
  userStats?: {
    activeRentals: Array<{
      id: string;
      car: string;
      returnDate: string;
      cost: number;
    }>;
    upcomingBookings: Array<{
      id: string;
      car: string;
      startDate: string;
      cost: number;
    }>;
    spending: {
      total: number;
      monthly: Array<{ month: string; amount: number }>;
    };
  };
}
