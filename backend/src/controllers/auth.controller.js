import {
	requestLoginOtp,
	requestSignupOtp,
	verifyLoginOtp,
	verifySignupOtp,
} from "../services/auth.service.js";
import { findUserById } from "../services/users.service.js";
import { AppError } from "../utils/appError.js";

export async function register(req, res) {
	const { fullName, email, phone, password, otp } = req.body;

	if (!otp) {
		const otpPayload = await requestSignupOtp({
			fullName,
			email,
			phone,
			password,
		});
		return res.status(202).json({
			message: "Signup OTP sent. Verify OTP to create the account.",
			...otpPayload,
		});
	}

	const { user, token } = await verifySignupOtp({
		fullName,
		email,
		phone,
		password,
		otp,
	});

	return res.status(201).json({
		message: "User registered successfully",
		user,
		token,
	});
}

export async function login(req, res) {
	const { identifier, password, otp, useMobile = false } = req.body;

	if (!otp) {
		const otpPayload = await requestLoginOtp({
			identifier,
			password,
			useMobile,
		});
		return res.status(202).json({
			message: "Login OTP sent. Verify OTP to complete login.",
			...otpPayload,
		});
	}

	const { user, token } = await verifyLoginOtp({
		identifier,
		password,
		otp,
		useMobile,
	});

	return res.status(200).json({
		message: "Login successful",
		user,
		token,
	});
}

export async function getProfile(req, res) {
	const user = await findUserById(req.user.id);

	if (!user) {
		throw new AppError("User not found", 404);
	}

	res.status(200).json({
		user,
	});
}

export async function requestRegisterOtp(req, res) {
	const otpPayload = await requestSignupOtp(req.body);

	return res.status(202).json({
		message: "Signup OTP sent. Verify OTP to create the account.",
		...otpPayload,
	});
}

export async function verifyRegisterOtp(req, res) {
	const { user, token } = await verifySignupOtp(req.body);

	return res.status(201).json({
		message: "User registered successfully",
		user,
		token,
	});
}

export async function requestLoginOtpController(req, res) {
	const otpPayload = await requestLoginOtp(req.body);

	return res.status(202).json({
		message: "Login OTP sent. Verify OTP to complete login.",
		...otpPayload,
	});
}

export async function verifyLoginOtpController(req, res) {
	const { user, token } = await verifyLoginOtp(req.body);

	return res.status(200).json({
		message: "Login successful",
		user,
		token,
	});
}
