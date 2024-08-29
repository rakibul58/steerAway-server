import { Types } from 'mongoose';

export interface IBooking {
  date: string;
  user: Types.ObjectId;
  car: Types.ObjectId;
  startTime: string;
  endTime: string;
  totalCost: number;
  additionalFeatures?: IAdditionalFeatures;
  paymentStatus?: 'Paid' | 'Pending';
  transactionId?: string | null;
  paidAt?: string;
  nidOrPassport: string;
  drivingLicense: string;
  status: 'Pending' | 'Approved' | 'Cancelled';
}

export interface ICreateBookingData {
  carId: string;
  date: string;
  startTime: string;
  additionalFeatures: IAdditionalFeatures;
  nidOrPassport: string;
  drivingLicense: string;
}

export interface IAdditionalFeatures {
  insurance: boolean;
  gps: boolean;
  childSeat: boolean;
}
