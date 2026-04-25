export function getHealth(_req, res) {
	return res.status(200).json({
		status: "ok",
		uptimeSeconds: Number(process.uptime().toFixed(2)),
		timestamp: new Date().toISOString(),
	});
}
