import { model, Schema } from 'mongoose';

const newsletterSubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Newsletter = model('Newsletter', newsletterSubscriberSchema);
