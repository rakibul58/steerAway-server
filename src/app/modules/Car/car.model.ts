import { Schema, model } from 'mongoose';
import { CarModel, ICar } from './car.interface';

// car schema
const carSchema = new Schema<ICar, CarModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    brand: {                  
      type: String,
      required: true,
    },
    model: {                   
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,         
    },
    description: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    isElectric: {
      type: Boolean,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'booked'],
      default: 'available',
    },
    features: [
      {
        type: String,
        required: true,
      },
    ],
    specifications: {         
      transmission: {
        type: String,
        enum: ['automatic', 'manual'],
        required: true,
      },
      fuelType: {
        type: String,
        enum: ['petrol', 'diesel', 'electric', 'hybrid'],
        required: true,
      },
      seatingCapacity: {
        type: Number,
        required: true,
      },
      mileage: {
        type: Number,
        required: true,
      }
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      hourlyRate: {
        type: Number,
        required: true,
      },
      dailyRate: {
        type: Number,
        required: true,
      },
      weeklyRate: {
        type: Number,
        required: true,
      },
      monthlyRate: {
        type: Number,
        required: true,
      },
      insurancePrice: {
        type: Number,
        default: 50,
      },
      childSeatPrice: {
        type: Number,
        default: 50,
      },
      gpsPrice: {
        type: Number,
        default: 50,
      }
    },
    images: [{                
      type: String,
      required: true,
    }],
    ratingStats: {
      averageRating: {
        type: Number,
        default: 0,
      },
      totalRatings: {
        type: Number,
        default: 0,
      },
      ratingDistribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 }
      }
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

carSchema.index({ status: 1, 'pricing.hourlyRate': 1 });
carSchema.index({ brand: 1, model: 1 });

// removing the car or cars that are deleted
carSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

carSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// checking if the car is exists
carSchema.statics.isCarExists = async function (id: string) {
  return await Car.findById(id);
};

export const Car = model<ICar, CarModel>('Car', carSchema);
