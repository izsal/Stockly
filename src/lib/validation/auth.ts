import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Masukkan alamat email yang valid.')
  .max(255, 'Alamat email terlalu panjang.')

const passwordSchema = z
  .string()
  .min(8, 'Kata sandi harus terdiri dari minimal 8 karakter.')
  .max(128, 'Kata sandi terlalu panjang.')

export const signInInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Masukkan kata sandi.'),
})

export const registerInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama harus terdiri dari minimal 2 karakter.')
    .max(80, 'Nama terlalu panjang.'),
  email: emailSchema,
  password: passwordSchema,
})

export const signUpFormSchema = registerInputSchema
  .extend({ confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Konfirmasi kata sandi belum cocok.',
    path: ['confirmPassword'],
  })
