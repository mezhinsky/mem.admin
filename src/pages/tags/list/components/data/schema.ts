import { z } from "zod";

export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Tag = z.infer<typeof tagSchema>;
