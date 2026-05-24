import {
	assignStudentToBatch,
	assignTrainerToBatch,
	createAnnouncement,
	createBatch,
	createInstitution,
	getBatchDetail,
	listAnnouncements,
	listBatches,
	listInstitutionMembers,
	listInstitutions,
	removeStudentFromBatch,
	removeTrainerFromBatch,
	updateBatch,
	updateInstitution,
} from "../services/management.service.js";

export async function listInstitutionsController(req, res) {
	return res.status(200).json({ data: await listInstitutions(req.user) });
}

export async function createInstitutionController(req, res) {
	return res
		.status(201)
		.json({ data: await createInstitution(req.user, req.body) });
}

export async function updateInstitutionController(req, res) {
	return res.status(200).json({
		data: await updateInstitution(req.user, req.params.id, req.body),
	});
}

export async function listBatchesController(req, res) {
	return res.status(200).json({ data: await listBatches(req.user, req.query) });
}

export async function getBatchDetailController(req, res) {
	return res.status(200).json({
		data: await getBatchDetail(req.user, req.params.id),
	});
}

export async function removeTrainerController(req, res) {
	return res.status(200).json({
		data: await removeTrainerFromBatch(
			req.user,
			req.params.id,
			req.params.trainerId,
		),
	});
}

export async function removeStudentController(req, res) {
	return res.status(200).json({
		data: await removeStudentFromBatch(
			req.user,
			req.params.id,
			req.params.studentId,
		),
	});
}

export async function listInstitutionMembersController(req, res) {
	return res.status(200).json({
		data: await listInstitutionMembers(
			req.user,
			req.params.id,
			req.query.role,
		),
	});
}

export async function createBatchController(req, res) {
	return res.status(201).json({ data: await createBatch(req.user, req.body) });
}

export async function updateBatchController(req, res) {
	return res.status(200).json({
		data: await updateBatch(req.user, req.params.id, req.body),
	});
}

export async function assignTrainerController(req, res) {
	return res.status(200).json({
		data: await assignTrainerToBatch(
			req.user,
			req.params.id,
			req.body.trainerId,
		),
	});
}

export async function assignStudentController(req, res) {
	return res.status(200).json({
		data: await assignStudentToBatch(
			req.user,
			req.params.id,
			req.body.studentId,
		),
	});
}

export async function listAnnouncementsController(req, res) {
	return res.status(200).json({
		data: await listAnnouncements(req.user, req.query),
	});
}

export async function createAnnouncementController(req, res) {
	return res.status(201).json({
		data: await createAnnouncement(req.user, req.body),
	});
}
