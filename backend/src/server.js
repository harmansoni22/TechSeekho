import "dotenv/config";
import app from "./app.js";
import env from "./config/env.js";
import { connectMongo } from "./config/mongo.js";

await connectMongo();

const server = app.listen(env.port, () => {
	console.log(`Backend running on port ${env.port}`);
});

function shutdown(signal) {
	console.log(`Received ${signal}. Shutting down gracefully...`);

	server.close(() => {
		process.exit(0);
	});

	setTimeout(() => {
		process.exit(1);
	}, 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
