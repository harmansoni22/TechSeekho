import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
	const courses = await prisma.course.findMany();
	console.log(JSON.stringify(courses, null, 2));
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
