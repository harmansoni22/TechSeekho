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

const router = Router();
const authLimiter = rateLimit({
	windowMs: 60_000,
	max: env.authRateLimitMax,
	keyPrefix: "auth",
	message: "Too many authentication attempts. Please try again shortly.",
});

router.post("/register/request-otp", authLimiter, (req, res, next) =>
	requestRegisterOtp(req, res).catch(next),
);
router.post("/register/verify-otp", authLimiter, (req, res, next) =>
	verifyRegisterOtp(req, res).catch(next),
);
router.post("/login/request-otp", authLimiter, (req, res, next) =>
	requestLoginOtpController(req, res).catch(next),
);
router.post("/login/verify-otp", authLimiter, (req, res, next) =>
	verifyLoginOtpController(req, res).catch(next),
);
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
