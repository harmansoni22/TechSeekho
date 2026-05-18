import {
	createLearningModule,
	createLearningPath,
	enrollInLearningPath,
	listLearningPaths,
	updateLearningModule,
	updateModuleProgressForUser,
} from "../services/modules.service.js";

export async function listLearningPathsController(req, res) {
	const paths = await listLearningPaths(req.user, req.query);
	return res.status(200).json({ data: paths });
}

export async function createLearningPathController(req, res) {
	const path = await createLearningPath(req.user, req.body);
	return res.status(201).json({ data: path });
}

export async function createLearningModuleController(req, res) {
	const module = await createLearningModule(
		req.user,
		req.params.pathId,
		req.body,
	);
	return res.status(201).json({ data: module });
}

export async function updateLearningModuleController(req, res) {
	const module = await updateLearningModule(
		req.user,
		req.params.moduleId,
		req.body,
	);
	return res.status(200).json({ data: module });
}

export async function enrollInLearningPathController(req, res) {
	const enrollment = await enrollInLearningPath(req.user, req.params.pathId);
	return res.status(200).json({ data: enrollment });
}

export async function updateModuleProgressController(req, res) {
	const progress = await updateModuleProgressForUser(
		req.user,
		req.params.moduleId,
		req.body.progress,
	);
	return res.status(200).json({ data: progress });
}
