import { processChatMessage } from "../services/ai.service.js";
import { AppError } from "../utils/appError.js";

export async function sendChatMessage(req, res, next) {
	try {
		const { message } = req.body;

		if (!message) {
			return next(new AppError("Message is required", 400, "MESSAGE_REQUIRED"));
		}

		const result = await processChatMessage(message);

		return res.status(200).json({
			success: true,
			data: {
				response: result.response,
				timestamp: result.timestamp,
				messageId: result.messageId,
			},
		});
	} catch (error) {
		return next(new AppError(error.message, 502, "CHAT_PROCESSING_ERROR"));
	}
}
