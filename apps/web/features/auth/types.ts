import { z } from "zod";

export const UserMeSchema = z.object({
  id: z.number(),
  username: z.string(),
  fullname: z.string(),
  name: z.string(),
  role_name: z.string(),
  quiz_role: z.string(),
});

export type UserMe = z.infer<typeof UserMeSchema>;
