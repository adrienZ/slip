import { type Router, defineEventHandler, readValidatedBody } from "h3";
import type { SlipAuthCore } from "@slip/core";
import z from "zod";

export function createAuthRoutes(router: Router, auth: SlipAuthCore, prefix = "/auth") {
  function createRoutePath(pathWithoutPrefix: string) {
    return prefix + pathWithoutPrefix;
  }

  router.add(createRoutePath("/register"), registerRoute(auth), "post")
  router.add(createRoutePath("/login"), loginRoute(auth), "post")
}


const registerUserSchema = z.object({
  email: z.string().min(1).email(),
})
const registerRoute = (auth: SlipAuthCore) => defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerUserSchema.parse);
  const userId = String(Math.round(Math.random() * 10_000));

  const createdUser = await auth.registerUser(userId, body.email);

  return createdUser;
})


const loginUserSchema = z.object({
  email: z.string().min(1).email(),
})
const loginRoute = (auth: SlipAuthCore) => defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginUserSchema.parse);

  const createdUser = await auth.loginUser(body.email);

  return createdUser;
})




