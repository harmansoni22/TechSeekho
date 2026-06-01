import {
	getAdminAnalytics,
	getAdminOverview,
} from "../services/adminDashboard.service.js";
import {
	bulkCreateInstitutionStudents,
	createInstitutionStudent,
	createInstitutionTrainer,
	listInstitutionPeople,
	setInstitutionUserStatus,
} from "../services/onboarding.service.js";

export async function getAdminOverviewController(req, res) {
	return res
		.status(200)
		.json({ data: await getAdminOverview(req.user, req.query) });
}

export async function getAdminAnalyticsController(req, res) {
	return res
		.status(200)
		.json({ data: await getAdminAnalytics(req.user, req.query) });
}

export async function listInstitutionPeopleController(req, res) {
	return res.status(200).json({
		data: await listInstitutionPeople(
			req.user,
			req.query.institutionId,
			req.query,
		),
	});
}

export async function createStudentController(req, res) {
	return res.status(201).json({
		data: await createInstitutionStudent(req.user, req.body, req),
	});
}

export async function bulkCreateStudentsController(req, res) {
	return res.status(201).json({
		data: await bulkCreateInstitutionStudents(req.user, req.body, req),
	});
}

export async function createTrainerController(req, res) {
	return res.status(201).json({
		data: await createInstitutionTrainer(req.user, req.body, req),
	});
}

export async function setMemberStatusController(req, res) {
	return res.status(200).json({
		data: await setInstitutionUserStatus(
			req.user,
			req.params.userId,
			req.body.status,
			req,
		),
	});
}
