import mongoose from "mongoose";

(async () => {
	await mongoose.connect(process.env.MONGODB_URI);
	console.log(
		"OK",
		(await mongoose.connection.db.listCollections().toArray()).length,
		"collections",
	);
	await mongoose.disconnect();
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
