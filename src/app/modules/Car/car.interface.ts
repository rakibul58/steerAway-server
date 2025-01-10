import { Model } from 'mongoose';

interface Specifications {
  transmission: 'automatic' | 'manual';
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  seatingCapacity: number;
  mileage: number;
}

interface Pricing {
  basePrice: number;
  hourlyRate: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  insurancePrice?: number;
  childSeatPrice?: number;
  gpsPrice?: number;
}

export interface ICar {
  name: string;
  brand: string;
  model: string;
  year: string;
  description: string;
  color: string;
  isElectric: boolean;
  status: 'available' | 'reserved' | 'booked';
  features: string[];
  specifications: Specifications;
  pricing: Pricing;
  images: string[];
  ratingStats: {
    averageRating: number;
    totalRatings: number;
    ratingDistribution: {
      [key: number]: number;
    };
  };
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReturnCarBooking {
  bookingId: string;
  endTime: string;
  endDate: string
}

export interface CarModel extends Model<ICar> {
  // eslint-disable-next-line no-unused-vars
  isCarExists(id: string): Promise<ICar>;
}
