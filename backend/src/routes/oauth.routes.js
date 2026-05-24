import { Router } from "express";
import env from "../config/env.js";
import { oauthLogin } from "../controllers/oauth.controller.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { validate } from "../middlewares/validate.js";
import { oauthLoginSchema } from "../validators/schemas.js";

const router = Router();

// OAuth login is unauthenticated and triggers outbound Google/GitHub calls.
// Without a limiter, an attacker can grind through provider verification at
// the provider's expense and ours. Use the same budget as credentials auth.
const oauthLimiter = rateLimit({
	windowMs: 60_000,
	max: env.authRateLimitMax,
	keyPrefix: "oauth",
	message: "Too many OAuth attempts. Please try again shortly.",
});

router.post(
	"/login",
	oauthLimiter,
	validate({ body: oauthLoginSchema }),
	(req, res, next) => oauthLogin(req, res).catch(next),
);

export default router;
