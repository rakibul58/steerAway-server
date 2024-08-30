import { Types } from 'mongoose';

export interface IReview {
  date: string;
  user: Types.ObjectId;
  car: Types.ObjectId;
  rating: number;
  comment: string;
}
