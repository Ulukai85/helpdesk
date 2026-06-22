import { z } from "zod";

export enum Role {
  ADMIN = "ADMIN",
  AGENT = "AGENT",
}

/** Shape returned by GET /api/users and PATCH /api/users/:id */
export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

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

export type CreateUserData = z.infer<typeof createUserSchema>;
export type EditUserData = z.infer<typeof editUserSchema>;

// Alias used where a single type is needed for shared form default values.
// Both schemas produce the same shape so either inferred type works here.
export type UserFormData = CreateUserData;
