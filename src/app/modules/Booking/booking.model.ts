import { Schema, model } from 'mongoose';
import { IAdditionalFeatures, IBooking } from './booking.interface';

const additionalFeaturesSchema = new Schema<IAdditionalFeatures>({
  insurance: {
    type: Boolean,
    default: false,
  },
  gps: {
    type: Boolean,
    default: false,
  },
  childSeat: {
    type: Boolean,
    default: false,
  },
});

// booking schema
const bookingSchema = new Schema<IBooking>(
  {
    date: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    car: {
      type: Schema.Types.ObjectId,
      ref: 'Car',
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      default: null,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    additionalFeatures: additionalFeaturesSchema,
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending',
    },
    transactionId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: String,
    },
    nidOrPassport: {
      type: String,
      required: true,
    },
    drivingLicense: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Cancelled', 'Returned'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  },
);

export const Booking = model<IBooking>('Booking', bookingSchema);
