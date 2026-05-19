import { getPlatformOverview } from "../services/admin.service.js";

export async function getPlatformOverviewController(req, res) {
	const data = await getPlatformOverview(req.user);
	return res.status(200).json({ data });
}
