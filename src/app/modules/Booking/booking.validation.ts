import { z } from 'zod';

// booking validation schema
const createBookingValidationSchema = z.object({
  body: z.object({
    carId: z.string({ required_error: 'Card Id is required!' }),
    date: z.string({ required_error: 'Date is required!' }),
    startTime: z.string({ required_error: 'Start time is required!' }),
    additionalFeatures: z.array(z.string()).optional().default([]),
    nidOrPassport: z.string({ required_error: 'Nid/Password is required!' }),
    drivingLicense: z.string({ required_error: 'Driving License is required!' }),
  }),
});

export const BookingValidations = {
  createBookingValidationSchema,
};
