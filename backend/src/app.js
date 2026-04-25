import cors from "cors";
import express from "express";
import corsOptions from "./config/cors.js";
import env from "./config/env.js";
import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";
import securityHeaders from "./middlewares/securityHeaders.js";
import routes from "./routes/index.js";

const app = express();

app.disable("x-powered-by");

if (env.trustProxy) {
	app.set("trust proxy", 1);
}

app.use(securityHeaders);
app.use(cors(corsOptions));

app.use(express.json({ limit: env.jsonLimit }));
app.use(express.urlencoded({ extended: false, limit: env.jsonLimit }));

app.use("/", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
