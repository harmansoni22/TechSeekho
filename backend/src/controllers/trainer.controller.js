import { getTrainerOverview } from "../services/trainer.service.js";

export async function getTrainerOverviewController(req, res) {
	const data = await getTrainerOverview(req.user);
	return res.status(200).json({ data });
}
