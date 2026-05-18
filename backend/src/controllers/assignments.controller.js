import {
	createAssignment,
	getAssignment,
	listAssignments,
	reviewSubmission,
	submitAssignment,
} from "../services/assignments.service.js";

export async function listAssignmentsController(req, res) {
	const assignments = await listAssignments(req.user, req.query);
	return res.status(200).json({ data: assignments });
}

export async function getAssignmentController(req, res) {
	const assignment = await getAssignment(req.user, req.params.id);
	return res.status(200).json({ data: assignment });
}

export async function createAssignmentController(req, res) {
	const assignment = await createAssignment(req.user, req.body);
	return res.status(201).json({ data: assignment });
}

export async function submitAssignmentController(req, res) {
	const submission = await submitAssignment(req.user, req.params.id, req.body);
	return res.status(200).json({ data: submission });
}

export async function reviewSubmissionController(req, res) {
	const submission = await reviewSubmission(
		req.user,
		req.params.submissionId,
		req.body,
	);
	return res.status(200).json({ data: submission });
}
