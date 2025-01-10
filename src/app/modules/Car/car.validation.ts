import { z } from 'zod';

// create car validation schema
const createCarValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required!' }).trim(),
    brand: z.string({ required_error: 'Brand is required!' }).trim(),
    model: z.string({ required_error: 'Model is required!' }).trim(),
    year: z.string({ required_error: 'Year is required!' }).trim(),
    description: z
      .string({ required_error: 'Description is required!' })
      .trim(),
    color: z.string({ required_error: 'Color is required!' }).trim(),
    isElectric: z.boolean({ required_error: 'isElectric is required!' }),
    status: z
      .enum(['available', 'reserved', 'booked'], {
        invalid_type_error: 'Add a valid status',
      })
      .optional()
      .default('available'),
    features: z.array(
      z.string({ required_error: 'Each feature must be a string!' }),
      {
        required_error: 'Features are required!',
      },
    ),
    specifications: z.object({
      transmission: z.enum(['automatic', 'manual'], {
        required_error: 'Transmission type is required!',
      }),
      fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid'], {
        required_error: 'Fuel type is required!',
      }),
      seatingCapacity: z.number({
        required_error: 'Seating capacity is required!',
      }),
      mileage: z.number({ required_error: 'Mileage is required!' }),
    }),
    pricing: z.object({
      basePrice: z.number({ required_error: 'Base price is required!' }),
      hourlyRate: z.number({ required_error: 'Hourly rate is required!' }),
      dailyRate: z.number({ required_error: 'Daily rate is required!' }),
      weeklyRate: z.number({ required_error: 'Weekly rate is required!' }),
      monthlyRate: z.number({ required_error: 'Monthly rate is required!' }),
      insurancePrice: z.number().optional().default(50),
      childSeatPrice: z.number().optional().default(50),
      gpsPrice: z.number().optional().default(50),
    }),
    images: z.array(
      z.string({ required_error: 'Each image must be a string!' }),
      {
        required_error: 'Images are required!',
      },
    ),
    ratingStats: z
      .object({
        averageRating: z.number().optional().default(0),
        totalRatings: z.number().optional().default(0),
        ratingDistribution: z.object({
          1: z.number().optional().default(0),
          2: z.number().optional().default(0),
          3: z.number().optional().default(0),
          4: z.number().optional().default(0),
          5: z.number().optional().default(0),
        }),
      })
      .optional()
      .default({
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }),
    isDeleted: z.boolean().optional().default(false),
  }),
});

// update car validation schema
const updateCarValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required!' }).trim().optional(),
    brand: z.string({ required_error: 'Brand is required!' }).trim().optional(),
    model: z.string({ required_error: 'Model is required!' }).trim().optional(),
    year: z.string({ required_error: 'Year is required!' }).trim().optional(),
    description: z
      .string({ required_error: 'Description is required!' })
      .trim()
      .optional(),
    color: z.string({ required_error: 'Color is required!' }).trim().optional(),
    isElectric: z
      .boolean({ required_error: 'isElectric is required!' })
      .optional(),
    status: z
      .enum(['available', 'reserved', 'booked'], {
        invalid_type_error: 'Add a valid status',
      })
      .optional(),
    features: z
      .array(z.string({ required_error: 'Each feature must be a string!' }), {
        required_error: 'Features are required!',
      })
      .optional(),
    specifications: z
      .object({
        transmission: z
          .enum(['automatic', 'manual'], {
            required_error: 'Transmission type is required!',
          })
          .optional(),
        fuelType: z
          .enum(['petrol', 'diesel', 'electric', 'hybrid'], {
            required_error: 'Fuel type is required!',
          })
          .optional(),
        seatingCapacity: z
          .number({ required_error: 'Seating capacity is required!' })
          .optional(),
        mileage: z
          .number({ required_error: 'Mileage is required!' })
          .optional(),
      })
      .optional(),
    pricing: z
      .object({
        basePrice: z
          .number({ required_error: 'Base price is required!' })
          .optional(),
        hourlyRate: z
          .number({ required_error: 'Hourly rate is required!' })
          .optional(),
        dailyRate: z
          .number({ required_error: 'Daily rate is required!' })
          .optional(),
        weeklyRate: z
          .number({ required_error: 'Weekly rate is required!' })
          .optional(),
        monthlyRate: z
          .number({ required_error: 'Monthly rate is required!' })
          .optional(),
        insurancePrice: z.number().optional(),
        childSeatPrice: z.number().optional(),
        gpsPrice: z.number().optional(),
      })
      .optional(),
    images: z
      .array(z.string({ required_error: 'Each image must be a string!' }))
      .optional(),
    ratingStats: z
      .object({
        averageRating: z.number().optional(),
        totalRatings: z.number().optional(),
        ratingDistribution: z
          .object({
            1: z.number().optional(),
            2: z.number().optional(),
            3: z.number().optional(),
            4: z.number().optional(),
            5: z.number().optional(),
          })
          .optional(),
      })
      .optional(),
    isDeleted: z.boolean().optional(),
  }),
});

// return car validation schema
const returnCarBookingValidationSchema = z.object({
  body: z.object({
    bookingId: z.string({ required_error: 'Booking Id is required!' }),
    endTime: z.string({ required_error: 'End time is required!' }),
    endDate: z.string({
      required_error: 'End date is required!'
    }),
  }),
});

export const CarValidations = {
  createCarValidationSchema,
  updateCarValidationSchema,
  returnCarBookingValidationSchema,
};
