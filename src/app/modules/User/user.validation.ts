import { z } from 'zod';

// Validation for register
const userRegisterValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required!' }).trim(),
    email: z
      .string({ required_error: 'Email is required!' })
      .trim()
      .email({ message: 'Please enter a valid email' }),
    role: z
      .enum(['admin', 'user'], {
        invalid_type_error: 'Enter a valid role',
      })
      .optional()
      .default('user'),
    password: z
      .string()
      .max(20, "Password can't be more than 20 characters!")
      .optional(),
    phone: z.string().optional().nullable().default(null),
    preferences: z.string().optional().nullable().default(null),
    address: z.string().optional().nullable().default(null),
  }),
});

// Validation for update profile
const updateUserValidation = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    email: z
      .string()
      .trim()
      .email({ message: 'Please enter a valid email' })
      .optional(),
    role: z
      .enum(['admin', 'user'], {
        invalid_type_error: 'Enter a valid role',
      })
      .optional()
      .default('user'),
    phone: z.string().optional().nullable().default(null),
    address: z.string().optional().nullable().default(null),
    preferences: z.string().optional().nullable().default(null),
  }),
});

// Validation for update profile
const profileUpdateValidation = z.object({
  body: z.object({
    name: z.string().trim().optional(),
    email: z
      .string()
      .trim()
      .email({ message: 'Please enter a valid email' })
      .optional(),
    phone: z.string().optional().nullable().default(null),
    address: z.string().optional().nullable().default(null),
    preferences: z.string().optional().nullable().default(null),
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

// refresh token cookie validation
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
  profileUpdateValidation,
  updateUserValidation
};
