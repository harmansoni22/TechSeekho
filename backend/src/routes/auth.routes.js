import { Router } from "express";
import env from "../config/env.js";
import {
	getProfile,
	login,
	register,
	requestLoginOtpController,
	requestRegisterOtp,
	verifyLoginOtpController,
	verifyRegisterOtp,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import { validate } from "../middlewares/validate.js";
import {
	legacyLoginSchema,
	legacyRegisterSchema,
	loginRequestOtpSchema,
	loginVerifyOtpSchema,
	registerRequestOtpSchema,
	registerVerifyOtpSchema,
} from "../validators/schemas.js";

const router = Router();
// Auth is the highest-value brute-force target. When Redis is configured we
// fail closed: if the limiter store is unreachable we reject the request
// rather than fall through to the per-instance in-memory bucket (which an
// attacker can defeat by spraying many instances). Outside Redis-mode the
// in-memory bucket is still used.
const authLimiter = rateLimit({
	windowMs: 60_000,
	max: env.authRateLimitMax,
	keyPrefix: "auth",
	message: "Too many authentication attempts. Please try again shortly.",
	failClosed: true,
});

router.post(
	"/register/request-otp",
	authLimiter,
	validate({ body: registerRequestOtpSchema }),
	(req, res, next) => requestRegisterOtp(req, res).catch(next),
);
router.post(
	"/register/verify-otp",
	authLimiter,
	validate({ body: registerVerifyOtpSchema }),
	(req, res, next) => verifyRegisterOtp(req, res).catch(next),
);
router.post(
	"/login/request-otp",
	authLimiter,
	validate({ body: loginRequestOtpSchema }),
	(req, res, next) => requestLoginOtpController(req, res).catch(next),
);
router.post(
	"/login/verify-otp",
	authLimiter,
	validate({ body: loginVerifyOtpSchema }),
	(req, res, next) => verifyLoginOtpController(req, res).catch(next),
);
// Legacy combined endpoints. The schema accepts either request-otp or
// verify-otp shape; the controller branches on `otp` presence.
router.post(
	"/register",
	authLimiter,
	validate({ body: legacyRegisterSchema }),
	(req, res, next) => register(req, res).catch(next),
);
router.post(
	"/login",
	authLimiter,
	validate({ body: legacyLoginSchema }),
	(req, res, next) => login(req, res).catch(next),
);
router.get("/profile", authenticate, (req, res, next) =>
	getProfile(req, res).catch(next),
);

export default router;
