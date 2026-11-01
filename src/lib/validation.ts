import { z } from "zod";

/**
 * Client-side mirrors of the backend's zod schemas (`src/validators/*`), so a
 * mistake is caught under the field instead of after a round trip. The server
 * stays the authority — these only have to be no stricter than it is.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .refine((v) => v.split("@")[1] === "ug.sharda.ac.in", {
    message: "Only Sharda University student emails (ug.sharda.ac.in) are allowed",
  });

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(128, "At most 128 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number");

/** Individual rules, for the live checklist under the password field. */
export const passwordRules = [
  { label: "8+ characters", test: (v: string) => v.length >= 8 },
  { label: "Lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "Uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "A number", test: (v: string) => /[0-9]/.test(v) },
];

export const otpSchema = z
  .string()
  .trim()
  .length(6, "Enter the 6-digit code")
  .regex(/^\d+$/, "The code is numbers only");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "At least 3 characters")
      .max(50, "At most 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Letters and spaces only"),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "At least 3 characters")
      .max(20, "At most 20 characters")
      .regex(/^[a-z0-9._]+$/, "Lowercase letters, numbers, dots and underscores only"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotSchema = z.object({ email: emailSchema });

export const resetSchema = z
  .object({
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

export const editProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(50, "At most 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Letters and spaces only"),
  bio: z.string().trim().max(500, "At most 500 characters"),
  course: z.string().trim().max(100, "At most 100 characters"),
  contactNo: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[0-9]{10}$/.test(v), "Exactly 10 digits"),
});

export const modRequestSchema = z.object({
  contactNo: z.string().trim().regex(/^[0-9]{10}$/, "Exactly 10 digits"),
  motivation: z
    .string()
    .trim()
    .min(20, "Tell us a little more (at least 20 characters)")
    .max(1000, "At most 1000 characters"),
});

export const resourceSchema = z.object({
  title: z.string().trim().min(3, "At least 3 characters").max(100, "At most 100 characters"),
  program: z.string().trim().min(2, "Choose a programme").max(100),
  courseCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "At least 2 characters")
    .max(20, "At most 20 characters")
    .regex(/^[A-Z0-9 ]+$/, "Letters, numbers and spaces only"),
  courseName: z.string().trim().min(2, "At least 2 characters").max(100, "At most 100 characters"),
  semester: z
    .string()
    .regex(/^\d+$/, "Choose a semester")
    .refine((v) => Number(v) >= 1 && Number(v) <= 12, "Semester must be 1–12"),
  year: z.string().trim().regex(/^\d{4}-\d{2}$/, "Use the format 2024-25").or(z.literal("")),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
