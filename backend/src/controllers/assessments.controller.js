import {
	createAssessment,
	getAssessment,
	listAssessments,
	reviewAssessmentSubmission,
	submitAssessment,
	updateAssessment,
} from "../services/assessments.service.js";

export async function listAssessmentsController(req, res) {
	const assessments = await listAssessments(req.user, req.query);
	return res.status(200).json({ data: assessments });
}

export async function getAssessmentController(req, res) {
	const assessment = await getAssessment(req.user, req.params.id);
	return res.status(200).json({ data: assessment });
}

export async function createAssessmentController(req, res) {
	const assessment = await createAssessment(req.user, req.body);
	return res.status(201).json({ data: assessment });
}

export async function updateAssessmentController(req, res) {
	const assessment = await updateAssessment(req.user, req.params.id, req.body);
	return res.status(200).json({ data: assessment });
}

export async function submitAssessmentController(req, res) {
	const submission = await submitAssessment(req.user, req.params.id, req.body);
	return res.status(200).json({ data: submission });
}

export async function reviewAssessmentSubmissionController(req, res) {
	const submission = await reviewAssessmentSubmission(
		req.user,
		req.params.submissionId,
		req.body,
	);
	return res.status(200).json({ data: submission });
}
