import { AppError } from "../utils/appError.js";

const MESSAGE_MIN_LENGTH = 1;
const MESSAGE_MAX_LENGTH = 2000;

export function validateChatMessage(req, _res, next) {
	const { message } = req.body;

	if (!message) {
		return next(new AppError("Message is required.", 400, "MESSAGE_REQUIRED"));
	}

	if (typeof message !== "string") {
		return next(
			new AppError("Message must be a string.", 400, "MESSAGE_INVALID_TYPE"),
		);
	}

	if (message.length < MESSAGE_MIN_LENGTH) {
		return next(
			new AppError(
				`Message must be at least ${MESSAGE_MIN_LENGTH} character.`,
				400,
				"MESSAGE_TOO_SHORT",
			),
		);
	}

	if (message.length > MESSAGE_MAX_LENGTH) {
		return next(
			new AppError(
				`Message must not exceed ${MESSAGE_MAX_LENGTH} characters.`,
				400,
				"MESSAGE_TOO_LONG",
			),
		);
	}

	return next();
}
