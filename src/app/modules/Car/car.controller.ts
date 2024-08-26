import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { CarServices } from './car.service';

// Car controllers

const createCar = catchAsync(async (req, res) => {
  const result = await CarServices.createCarIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Car created successfully',
    data: result,
  });
});

const getAllCars = catchAsync(async (req, res) => {
  const result = await CarServices.getAllCarsFromDB(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Cars retrieved successfully',
    data: result,
  });
});

const getSingleCar = catchAsync(async (req, res) => {
  const result = await CarServices.getSingleCarFromDB(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'A Car retrieved successfully',
    data: result,
  });
});

const updateSingleCar = catchAsync(async (req, res) => {
  const result = await CarServices.updateACarInDB(req.params.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Car updated successfully',
    data: result,
  });
});

const deleteSingleCar = catchAsync(async (req, res) => {
  const result = await CarServices.deleteACarFromDB(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Car Deleted successfully',
    data: result,
  });
});

const returnCarUpdate = catchAsync(async (req, res) => {
  const result = await CarServices.returnCarUpdateInDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Car returned successfully',
    data: result,
  });
});

export const CarControllers = {
  createCar,
  getAllCars,
  getSingleCar,
  updateSingleCar,
  deleteSingleCar,
  returnCarUpdate,
};
