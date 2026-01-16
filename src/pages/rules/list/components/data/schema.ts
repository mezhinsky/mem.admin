import { z } from "zod";

export const ruleSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  type: z.enum(["TAG", "CATEGORY", "ALL"]),
  value: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  channel: z
    .object({
      id: z.string(),
      key: z.string(),
      title: z.string().nullable(),
    })
    .optional(),
});

export type Rule = z.infer<typeof ruleSchema>;

