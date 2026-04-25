import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: envPath });

function parseBoolean(value, fallback = false) {
	if (typeof value !== "string") return fallback;
	const normalized = value.trim().toLowerCase();
	return ["1", "true", "yes", "on"].includes(normalized);
}

function parsePort(value, fallback = 4000) {
	const parsed = Number.parseInt(value ?? "", 10);
	if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
	return parsed;
}

function parseOrigins(value) {
	if (!value || typeof value !== "string") return [];
	return value
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const corsOrigins = parseOrigins(
	process.env.CORS_ORIGINS || "http://localhost:3000",
);

if (isProduction && corsOrigins.length === 0) {
	throw new Error("CORS_ORIGINS must be set in production.");
}

const env = Object.freeze({
	nodeEnv,
	isProduction,
	isDevelopment: nodeEnv === "development",
	port: parsePort(process.env.PORT, 4000),
	corsOrigins,
	corsAllowNoOrigin: parseBoolean(
		process.env.CORS_ALLOW_NO_ORIGIN,
		!isProduction,
	),
	jsonLimit: process.env.JSON_LIMIT || "100kb",
	trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
	exposeErrorDetails: parseBoolean(
		process.env.EXPOSE_ERROR_DETAILS,
		!isProduction,
	),
	hfToken: process.env.HF_TOKEN || "",
	hfModel: process.env.HF_MODEL || "Qwen/Qwen2.5-7B-Instruct",
	hfProvider: process.env.HF_PROVIDER || "together",
});

export default env;
