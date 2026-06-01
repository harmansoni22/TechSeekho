import {
	getInstitutionDetail,
	getPlatformAnalytics,
	getPlatformConfig,
	getPlatformOverview,
	grantRoleAssignment,
	listAdmins,
	listAuditLogs,
	listRoles,
	revokeRoleAssignment,
	setUserStatus,
} from "../services/admin.service.js";

export async function getPlatformOverviewController(req, res) {
	const data = await getPlatformOverview(req.user);
	return res.status(200).json({ data });
}

export async function getInstitutionDetailController(req, res) {
	const data = await getInstitutionDetail(req.user, req.params.id);
	return res.status(200).json({ data });
}

export async function listAdminsController(req, res) {
	const data = await listAdmins(req.user, req.query);
	return res.status(200).json({ data });
}

export async function listRolesController(req, res) {
	const data = await listRoles(req.user);
	return res.status(200).json({ data });
}

export async function grantRoleAssignmentController(req, res) {
	const data = await grantRoleAssignment(req.user, req.body, req);
	return res.status(201).json({ data });
}

export async function revokeRoleAssignmentController(req, res) {
	const data = await revokeRoleAssignment(req.user, req.params.id, req);
	return res.status(200).json({ data });
}

export async function setUserStatusController(req, res) {
	const data = await setUserStatus(
		req.user,
		req.params.id,
		req.body.status,
		req.body.reason ?? null,
		req,
	);
	return res.status(200).json({ data });
}

export async function listAuditLogsController(req, res) {
	const data = await listAuditLogs(req.user, req.query);
	return res.status(200).json({ data });
}

export async function getPlatformAnalyticsController(req, res) {
	const data = await getPlatformAnalytics(req.user, req.query);
	return res.status(200).json({ data });
}

export async function getPlatformConfigController(req, res) {
	const data = await getPlatformConfig(req.user);
	return res.status(200).json({ data });
}
