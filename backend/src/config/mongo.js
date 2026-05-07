import mongoose from "mongoose";

export const connectMongo = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("MongoDB Connected Successfully");
	} catch (err) {
		console.error("MongoDB connection error:", err.message);
		// Don't exit - allow server to run without MongoDB
		throw err;
	}
};
