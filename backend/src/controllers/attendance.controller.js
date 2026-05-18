import {
	bulkMarkAttendance,
	listAttendance,
	markAttendance,
} from "../services/attendance.service.js";

export async function listAttendanceController(req, res) {
	const attendance = await listAttendance(req.user, req.query);
	return res.status(200).json({ data: attendance });
}

export async function markAttendanceController(req, res) {
	const attendance = await markAttendance(req.user, req.body);
	return res.status(200).json({ data: attendance });
}

export async function bulkMarkAttendanceController(req, res) {
	const attendance = await bulkMarkAttendance(req.user, req.body);
	return res.status(200).json({ data: attendance });
}
