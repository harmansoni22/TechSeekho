import mongoose from "mongoose";

export const connectMongo = async () => {
	try {
		if (!process.env.MONGODB_URI) {
			throw new Error("MONGODB_URI is missing in environment variables");
		}

		if (mongoose.connection.readyState === 1) {
			console.log("MongoDB already connected");
			return mongoose.connection;
		}

		console.log("Connecting to MongoDB...");
		console.log("URI exists:", !!process.env.MONGODB_URI);

		await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
		});

		while (!mongoose.connection.readyState) {
			console.log("Waiting for MongoDB connection...");
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		console.log("MongoDB connected successfully");
		return mongoose.connection;
	} catch (err) {
		console.error("MongoDB connection error:", err.message);
		throw err;
	}
};
