import { getAllUsers } from "../services/users.service.js";

export async function listUsers(req, res) {
	const result = await getAllUsers(req.user, req.query);
	return res.status(200).json(result);
}
