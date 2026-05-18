import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is missing");
}

const globalForPrisma = globalThis;

const adapter =
	globalForPrisma.__techSeekhoPrismaAdapter ??
	new PrismaPg({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.__techSeekhoPrismaAdapter = adapter;
}

const prisma =
	globalForPrisma.__techSeekhoPrisma ??
	new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.__techSeekhoPrisma = prisma;
}

export default prisma;
