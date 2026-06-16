import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.email("Invalid email address"),
  password: z.string().trim().min(8, "Password must be at least 8 characters"),
});

export const editUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
  email: z.email("Invalid email address"),
  password: z.string().refine(
    (val) => val === "" || val.trim().length >= 8,
    "Password must be at least 8 characters"
  ),
});

// Both schemas infer the same shape; use this for the shared form type
export type UserFormData = z.infer<typeof createUserSchema>;
