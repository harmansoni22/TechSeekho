import { InferenceClient } from "@huggingface/inference";
import env from "../config/env.js";
import { courses } from "../data/courses.data.js";

const hfClient = new InferenceClient(env.hfToken);
const FALLBACK_MODELS = [
	{ model: "Qwen/Qwen2.5-7B-Instruct", provider: "together" },
];

function buildCourseContext() {
	return courses
		.map(
			(course) =>
				`${course.title} (${course.slug}) | ${course.shortDescription} | ` +
				`Price: INR ${course.price} | Starts: ${course.startsAt} | Status: ${course.enrollmentStatus}`,
		)
		.join("\n");
}

function getSystemPrompt() {
	return [
		"You are TechSeekho's AI learning assistant.",
		"Answer briefly, clearly, and helpfully.",
		"Recommend only TechSeekho courses from the provided catalog when asked about learning paths.",
		"If a user asks for a fact not present in the provided context, say you do not know instead of inventing it.",
		"Keep answers under 120 words unless the user explicitly asks for more detail.",
		"All prices are in INR.",
		"",
		"Available TechSeekho courses:",
		buildCourseContext(),
	].join("\n");
}

function getAssistantText(payload) {
	const content = payload?.choices?.[0]?.message?.content;

	if (typeof content === "string") {
		return content.trim();
	}

	if (Array.isArray(content)) {
		return content
			.map((part) => (typeof part?.text === "string" ? part.text : ""))
			.join("")
			.trim();
	}

	return "";
}

function shouldRetryWithFallback(error) {
	const message = error instanceof Error ? error.message.toLowerCase() : "";

	return (
		message.includes("model_not_supported") ||
		message.includes("not supported by any provider") ||
		message.includes("not been able to find inference provider information")
	);
}

function buildModelCandidates() {
	const configured = { model: env.hfModel, provider: env.hfProvider };
	const seen = new Set();

	return [configured, ...FALLBACK_MODELS].filter((candidate) => {
		const key = `${candidate.model}::${candidate.provider}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

async function requestCompletionWithCandidate(message, candidate) {
	const payload = await hfClient.chatCompletion({
		model: candidate.model,
		provider: candidate.provider,
		messages: [
			{ role: "system", content: getSystemPrompt() },
			{ role: "user", content: message },
		],
		temperature: 0.4,
		max_tokens: 220,
	});
	const content = getAssistantText(payload);

	if (!content) {
		throw new Error(
			`Hugging Face returned an empty response for ${candidate.model}`,
		);
	}

	return content;
}

async function requestHuggingFaceCompletion(message) {
	if (!env.hfToken) {
		throw new Error("HF_TOKEN is missing in backend environment variables");
	}

	const candidates = buildModelCandidates();
	let lastError = null;

	for (const candidate of candidates) {
		try {
			return await requestCompletionWithCandidate(message, candidate);
		} catch (error) {
			lastError = error;

			if (!shouldRetryWithFallback(error)) {
				throw error;
			}
		}
	}

	throw lastError || new Error("Hugging Face request failed");
}

export async function processChatMessage(message) {
	if (!message || typeof message !== "string" || message.trim().length === 0) {
		throw new Error("Invalid message: message must be a non-empty string");
	}

	const response = await requestHuggingFaceCompletion(message.trim());

	return {
		response,
		timestamp: new Date().toISOString(),
		messageId: Date.now().toString(),
	};
}
