import mongoose from "mongoose";

export const connectMongo = async () => {
	try {
		if (!process.env.MONGODB_URI) {
			throw new Error(".env not working");
		}

		console.log("Connecting to mongoDB");

		console.log("URI exists: " + !!process.env.MONGODB_URI)

		await mongoose.connect(process.env.MONGODB_URI);
		console.log("MongoDB Connected Successfully");
	} catch (err) {
		console.error("MongoDB connection error:", err.message);
		// Don't exit - allow server to run without MongoDB
		throw err;
	}
};
