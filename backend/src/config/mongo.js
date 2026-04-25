import mongoose from "mongoose";

export const connectMongo = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log("MongoDB Connected Successfully");
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};
