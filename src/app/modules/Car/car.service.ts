import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { ICar, IReturnCarBooking } from './car.interface';
import { Car } from './car.model';
import { Booking } from '../Booking/booking.model';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import { carSearchableFields } from './car.constant';

// creating a car in the db
const createCarIntoDB = async (payload: ICar) => {
  const result = await Car.create(payload);
  return result;
};

// getting all the cars
const getAllCarsFromDB = async (query: Record<string, unknown>) => {
  const CarQuery = new QueryBuilder(Car.find(), query)
    .search(carSearchableFields)
    .filter()
    .sort()
    .priceRange()
    .paginate()
    .fields();

  const result = await CarQuery.modelQuery;
  const meta = await CarQuery.countTotal();

  // checking if there is any cars
  if (result.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Data Found');
  }
  return { result, meta };
};

// get single car
const getSingleCarFromDB = async (id: string) => {
  const result = await Car.isCarExists(id);
  // checking if the car exists
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Data Found');
  }
  return result;
};

// update a car
const updateACarInDB = async (id: string, payload: Partial<ICar>) => {
  const result = await Car.isCarExists(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Data Found');
  }
  const updatedCar = await Car.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return updatedCar;
};

// deleting a car
const deleteACarFromDB = async (id: string) => {
  const result = await Car.isCarExists(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'No Data Found');
  }
  const deletedCar = await Car.findByIdAndUpdate(
    id,
    { isDeleted: true },
    {
      new: true,
      runValidators: true,
    },
  );

  return deletedCar;
};

// return car service
const returnCarUpdateInDB = async (payload: IReturnCarBooking) => {
  const bookingData = await Booking.findById(payload.bookingId);
  // checking if booking exists
  if (!bookingData) {
    throw new AppError(httpStatus.NOT_FOUND, 'This booking does not exists');
  }

  // checking if the car exists
  const carData = await Car.findById(bookingData.car);
  if (!carData) {
    throw new AppError(httpStatus.NOT_FOUND, 'This Car does not exists');
  }

  // double checking if the car is available
  if (carData.status == 'available') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This Car is not booked or returned already',
    );
  }

  // starting the mongoose session
  const session = await mongoose.startSession();
  try {
    // starting transaction
    session.startTransaction();

    // updating car status to available as it is returned
    await Car.findByIdAndUpdate(
      carData._id,
      {
        status: 'available',
      },
      {
        runValidators: true,
        new: true,
        session,
      },
    );

    // total cost calculations
    const [startTimeInHours, startTimeInMinutes] =
      bookingData.startTime.split(':');
    const [endTimeInHours, endTimeInMinutes] = payload.endTime.split(':');

    const totalStartTime =
      (Number(startTimeInHours) * 60.0 + Number(startTimeInMinutes)) / 60.0;
    const totalEndTime =
      (Number(endTimeInHours) * 60.0 + Number(endTimeInMinutes)) / 60.0;

    const rentingCost = (totalEndTime - totalStartTime) * carData.pricePerHour;
    let insuranceCost = 0,
      childSeatCost = 0,
      gpsCost = 0;
    if (bookingData.additionalFeatures?.insurance == true) {
      insuranceCost = Number(carData.insurancePrice);
    }
    if (bookingData.additionalFeatures?.childSeat == true) {
      childSeatCost = Number(carData.childSeatPrice);
    }
    if (bookingData.additionalFeatures?.gps == true) {
      gpsCost = Number(carData.gpsPrice);
    }
    // updating Booking with totalCost and end time
    const updatedBooking = await Booking.findByIdAndUpdate(
      payload.bookingId,
      {
        endTime: payload.endTime,
        rentingCost,
        insuranceCost,
        childSeatCost,
        gpsCost,
        totalCost: Number(
          rentingCost + insuranceCost + childSeatCost + gpsCost,
        ),
        status: 'Returned',
      },
      {
        runValidators: true,
        new: true,
        session,
      },
    )
      .populate('user')
      .populate('car');

    // Committing and ending session
    await session.commitTransaction();
    await session.endSession();

    // returning the updated booking
    return updatedBooking;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    // handling if there is an error
    await session.abortTransaction();
    await session.endSession();
    throw new Error(err);
  }
};

export const CarServices = {
  createCarIntoDB,
  getAllCarsFromDB,
  getSingleCarFromDB,
  updateACarInDB,
  deleteACarFromDB,
  returnCarUpdateInDB,
};
