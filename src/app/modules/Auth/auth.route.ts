import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidations } from '../User/user.validation';
import { AuthControllers } from './auth.controller';

const router = express.Router();

router.route('/signup').post(
  validateRequest(UserValidations.userRegisterValidationSchema), // validating schema
  AuthControllers.signupUser,
);

router
  .route('/signin')
  .post(
    validateRequest(UserValidations.signinValidationSchema),
    AuthControllers.signInUser,
  );

router.post(
  '/refresh-token',
  validateRequest(UserValidations.refreshTokenValidationSchema),
  AuthControllers.refreshToken,
);

export const AuthRoutes = router;
