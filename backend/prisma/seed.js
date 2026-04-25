import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { courses } from "../src/data/courses.data.js";

if (!process.env.DATABASE_URL) {
	throw new Error("Database URL not found/working");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
	for (const course of courses) {
		await prisma.course.upsert({
			where: { slug: course.slug },
			update: {
				title: course.title,
				shortDescription: course.shortDescription,
				description: course.description,
				bannerImage: course.bannerImage,
				startsAt: new Date(course.startsAt),
				endDate: new Date(course.endDate),
				enrollmentStatus: course.enrollmentStatus,
				price: course.price,
			},
			create: {
				slug: course.slug,
				title: course.title,
				shortDescription: course.shortDescription,
				description: course.description,
				bannerImage: course.bannerImage,
				startsAt: new Date(course.startsAt),
				endDate: new Date(course.endDate),
				enrollmentStatus: course.enrollmentStatus,
				price: course.price,
			},
		});
	}

	console.log(`seeded/updated ${courses.length} courses`);
}

main()
	.catch((err) => {
		console.error("Seed Failed: ", err);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
