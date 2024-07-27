import { defineEventHandler, readValidatedBody } from "h3";
import * as z from "zod";
import { useSlipAuth } from "../utils/slip.binding";

const registerUserSchema = z.object({
  email: z.string().min(1).email(),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerUserSchema.parse);
  const userId = String(Math.round(Math.random() * 10_000));

  const auth = useSlipAuth();
  const createdUser = await auth.registerUser(userId, body.email);

  return createdUser;
});
