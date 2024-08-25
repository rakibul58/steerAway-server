import { z } from 'zod';

// Validation for register
const userRegisterValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required!' }).trim(),
    email: z
      .string({ required_error: 'Email is required!' })
      .trim()
      .email({ message: 'Please enter a valid email' }),
    role: z.enum(['admin', 'user'], {
      invalid_type_error: 'Enter a valid role',
    }),
    password: z
      .string()
      .max(20, "Password can't be more than 20 characters!")
      .optional(),
    phone: z
      .string({ required_error: 'Phone number is required!' })
      .min(9, 'Please enter a valid phone!')
      .trim(),
    address: z.string({ required_error: 'Address is required!' }).trim(),
  }),
});

// Validation for signIn
const signinValidationSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required.' })
      .trim()
      .email({ message: 'Please enter a valid email' }),
    password: z.string({ required_error: 'Password is required' }),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({
      required_error: 'Refresh token is required!',
    }),
  }),
});

// exporting the schema
export const UserValidations = {
  userRegisterValidationSchema,
  signinValidationSchema,
  refreshTokenValidationSchema,
};
