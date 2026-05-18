import {
	getStudentAchievements,
	getStudentAssignments,
	getStudentAttendance,
	getStudentCourses,
	getStudentDashboardData,
	updateModuleProgress,
} from "../services/student.service.js";
import { AppError } from "../utils/appError.js";

export async function getDashboard(req, res) {
	const studentId = req.user.id;

	const dashboardData = await getStudentDashboardData(studentId);

	res.status(200).json({
		message: "Dashboard data retrieved successfully",
		data: dashboardData,
	});
}

export async function getCourses(req, res) {
	const studentId = req.user.id;

	const courses = await getStudentCourses(studentId);

	res.status(200).json({
		message: "Courses retrieved successfully",
		data: courses,
	});
}

export async function updateProgress(req, res) {
	const studentId = req.user.id;
	const { moduleId, progress } = req.body;

	if (!moduleId || progress === undefined) {
		throw new AppError("Module ID and progress are required", 400);
	}

	if (progress < 0 || progress > 100) {
		throw new AppError("Progress must be between 0 and 100", 400);
	}

	const updatedProgress = await updateModuleProgress(
		studentId,
		moduleId,
		progress,
	);

	res.status(200).json({
		message: "Progress updated successfully",
		data: updatedProgress,
	});
}

export async function getAssignments(req, res) {
	const studentId = req.user.id;

	const assignments = await getStudentAssignments(studentId);

	res.status(200).json({
		message: "Assignments retrieved successfully",
		data: assignments,
	});
}

export async function getAttendance(req, res) {
	const studentId = req.user.id;

	const attendance = await getStudentAttendance(studentId);

	res.status(200).json({
		message: "Attendance retrieved successfully",
		data: attendance,
	});
}

export async function getAchievements(req, res) {
	const studentId = req.user.id;

	const achievements = await getStudentAchievements(studentId);

	res.status(200).json({
		message: "Achievements retrieved successfully",
		data: achievements,
	});
}
