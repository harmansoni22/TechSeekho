import {
	createAdmin,
	listTrainers,
	listUsers,
	setInstitutionStatus,
	setTrainerStatus,
	terminateAdmin,
	terminateTrainer,
} from "../services/governance.service.js";

export async function setInstitutionStatusController(req, res) {
	const data = await setInstitutionStatus(
		req.user,
		req.params.id,
		req.body.status,
		req.body.reason,
		req,
	);
	return res.status(200).json({ data });
}

export async function listUsersController(req, res) {
	const data = await listUsers(req.user, req.query);
	return res.status(200).json({ data });
}

export async function createAdminController(req, res) {
	const data = await createAdmin(req.user, req.body, req);
	return res.status(201).json({ data });
}

export async function listTrainersController(req, res) {
	const data = await listTrainers(req.user, req.query);
	return res.status(200).json({ data });
}

export async function setTrainerStatusController(req, res) {
	const data = await setTrainerStatus(
		req.user,
		req.params.userId,
		req.body.status,
		req.body.reason,
		req,
	);
	return res.status(200).json({ data });
}

export async function terminateAdminController(req, res) {
	const data = await terminateAdmin(
		req.user,
		req.params.userId,
		req.body.reason,
		req.body.transfers,
		req,
	);
	return res.status(200).json({ data });
}

export async function terminateTrainerController(req, res) {
	const data = await terminateTrainer(
		req.user,
		req.params.userId,
		req.body.reason,
		req.body.reassignments,
		req,
	);
	return res.status(200).json({ data });
}
