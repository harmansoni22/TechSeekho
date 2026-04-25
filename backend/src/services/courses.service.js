// const PrismaClient = require('@prisma/client.js')
// import pkg from '@prisma/client'

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// const { PrismaClient } = pkg;

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function buildCourseReviewRows(course) {
	return [
		{
			id: `${course.id}-review-1`,
			name: "Aarav Sharma",
			role: "Frontend Developer",
			rating: 5,
			quote: `The ${course.title} structure was clear and practical. I could finish tasks consistently every week.`,
		},
		{
			id: `${course.id}-review-2`,
			name: "Meera Joshi",
			role: "Aspiring Fullstack Engineer",
			rating: 5,
			quote: `Mentor feedback in ${course.title} was direct and useful. I improved faster than self-study.`,
		},
		{
			id: `${course.id}-review-3`,
			name: "Rohan Verma",
			role: "Software Engineer Intern",
			rating: 5,
			quote: `${course.title} helped me build portfolio quality work with better confidence for interviews.`,
		},
	];
}

export async function getAllCourses() {
	return await prisma.course.findMany();
}

export async function getCourseBySlug(slug) {
	return await prisma.course.findUnique({
		where: { slug },
	});
}

export async function getCourseReviewsById(id) {
	const course = await prisma.course.findUnique({
		where: { id },
		select: {
			id: true,
			slug: true,
			title: true,
		},
	});

	if (!course) {
		return null;
	}

	return {
		courseId: course.id,
		courseSlug: course.slug,
		courseTitle: course.title,
		reviewSourceUrl: `/courses/${course.id}/reviews`,
		reviews: buildCourseReviewRows(course),
	};
}
