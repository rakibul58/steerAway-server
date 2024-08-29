import { Model } from 'mongoose';

export interface ICar {
  name: string;
  description: string;
  color: string;
  isElectric: boolean;
  status?: 'available' | 'unavailable';
  features: string[];
  pricePerHour: number;
  carType: string;
  image?: string;
  isDeleted?: boolean;
  insurancePrice?: number;
  gpsPrice?: number;
  childSeatPrice?: number;
  year?: string
}

export interface IReturnCarBooking {
  bookingId: string;
  endTime: string;
}

export interface CarModel extends Model<ICar> {
  // eslint-disable-next-line no-unused-vars
  isCarExists(id: string): Promise<ICar>;
}
