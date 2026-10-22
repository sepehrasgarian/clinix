import { auth } from "@clerk/nextjs/server";
import { clerkEnabled, registerServerToken } from "./auth";

/** Server components send the signed-in user's Clerk token to the API. Imported once, by the root layout. */
if (clerkEnabled) registerServerToken(async () => (await auth()).getToken());
