import { z } from "zod";

export const channelSchema = z.object({
  id: z.string(),
  key: z.string(),
  chatId: z.string(),
  username: z.string().nullable(),
  title: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Channel = z.infer<typeof channelSchema>;
