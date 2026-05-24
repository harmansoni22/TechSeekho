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
	loginRequestOtpSchema,
	loginVerifyOtpSchema,
	registerRequestOtpSchema,
	registerVerifyOtpSchema,
} from "../validators/schemas.js";

const router = Router();
const authLimiter = rateLimit({
	windowMs: 60_000,
	max: env.authRateLimitMax,
	keyPrefix: "auth",
	message: "Too many authentication attempts. Please try again shortly.",
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
// Legacy combined endpoints — also pass through validation. The optional
// otp field is enforced in the controller's branching logic.
router.post("/register", authLimiter, (req, res, next) =>
	register(req, res).catch(next),
);
router.post("/login", authLimiter, (req, res, next) =>
	login(req, res).catch(next),
);
router.get("/profile", authenticate, (req, res, next) =>
	getProfile(req, res).catch(next),
);

export default router;
