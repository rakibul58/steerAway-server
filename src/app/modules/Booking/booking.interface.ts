import { Types } from 'mongoose';

export interface IBooking {
  date: string;
  user: Types.ObjectId;
  car: Types.ObjectId;
  startTime: string;
  endTime: string;
  rentingCost: number;
  insuranceCost: number;
  childSeatCost: number;
  additionalCosts: {
    insuranceCost: number;
    gpsCost: number;
    childSeatCost: number;
  };
  gpsCost: number;
  totalCost: number;
  additionalFeatures?: IAdditionalFeatures;
  duration: 'hourly' | 'daily' | 'weekly' | 'monthly';
  baseCost: number;
  paymentStatus?: 'Paid' | 'Pending';
  transactionId?: string | null;
  paidAt?: string;
  nidOrPassport: string;
  drivingLicense: string;
  status: 'Pending' | 'Approved' | 'Cancelled' | 'Returned';
}

export interface ICreateBookingData {
  carId: string;
  date: string;
  startTime: string;
  additionalFeatures: IAdditionalFeatures;
  nidOrPassport: string;
  drivingLicense: string;
  duration: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

export interface IAdditionalFeatures {
  insurance: boolean;
  gps: boolean;
  childSeat: boolean;
}

export interface VerifyBookingQuery {
  transactionId: string;
  bookingId: string;
  status: string;
  customerName: string;
  totalPrice: string;
}