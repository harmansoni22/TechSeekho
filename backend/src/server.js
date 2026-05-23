import "dotenv/config";
import app from "./app.js";
import prisma from "./config/db.js";
import env from "./config/env.js";
import { connectMongo } from "./config/mongo.js";
import { closeRedis } from "./config/redis.js";

// Try to connect to MongoDB, but don't fail if it can't connect
if (process.env.MONGODB_URI) {
	connectMongo().catch((err) => {
		console.warn("MongoDB connection failed:", err.message);
		console.warn("Continuing without MongoDB...");
	});
}

const server = app.listen(env.port, () => {
	console.log(`Backend running on port ${env.port}`);
});

async function shutdown(signal) {
	console.log(`Received ${signal}. Shutting down gracefully...`);

	server.close(async () => {
		try {
			await prisma.$disconnect();
		} catch {
			// no-op
		}
		await closeRedis();
		process.exit(0);
	});

	setTimeout(() => {
		console.warn("Graceful shutdown timed out; forcing exit.");
		process.exit(1);
	}, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
