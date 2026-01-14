import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  role: z.enum(["USER", "ADMIN"]),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof userSchema>;
