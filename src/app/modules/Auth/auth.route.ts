import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { UserValidations } from '../User/user.validation';
import { AuthControllers } from './auth.controller';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../User/user.constant';

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

router
  .route('/me')
  .get(auth(USER_ROLE.user, USER_ROLE.admin), AuthControllers.getProfileData)
  .put(
    auth(USER_ROLE.user, USER_ROLE.admin),
    AuthControllers.updateProfileData,
  );

router
  .route('/users/:id')
  .get(auth(USER_ROLE.admin), AuthControllers.getSingleUser)
  .put(
    validateRequest(UserValidations.updateUserValidation),
    auth(USER_ROLE.admin),
    AuthControllers.updateUser,
  );

router.route('/users').get(auth(USER_ROLE.admin), AuthControllers.getAllUsers);

export const AuthRoutes = router;
