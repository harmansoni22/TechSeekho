import { api } from "@/lib/api";

export async function fetchStudentDashboard() {
	return api("/student/dashboard", {
		method: "GET",
	});
}

export async function fetchStudentCourses() {
	return api("/student/courses", {
		method: "GET",
	});
}

export async function fetchStudentAssignments() {
	return api("/student/assignments", {
		method: "GET",
	});
}

export async function fetchStudentAttendance() {
	return api("/student/attendance", {
		method: "GET",
	});
}

export async function fetchStudentAchievements() {
	return api("/student/achievements", {
		method: "GET",
	});
}

