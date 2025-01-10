import { Router } from 'express';
import { USER_ROLE } from '../User/user.constant';
import { NewsletterControllers } from './newsletter.controller';
import auth from '../../middlewares/auth';

const router = Router();

router
  .route('/')
  .get(auth(USER_ROLE.admin), NewsletterControllers.getNewsletter);

router.route('/:email').post(NewsletterControllers.subscribeToNewsletter);

export const NewsletterRoutes = router;
