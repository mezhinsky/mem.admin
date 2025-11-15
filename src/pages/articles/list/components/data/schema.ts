import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  priority: z.string(),
});

export type Task = z.infer<typeof taskSchema>;

export const atricleSchema = z.object({
  id: z.string(),
  title: z.string(),
  published: z.boolean(),
  description: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Article = z.infer<typeof atricleSchema>;
