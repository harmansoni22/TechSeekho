import env from "../config/env.js";

export default function securityHeaders(_req, res, next) {
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "DENY");
	res.setHeader("Referrer-Policy", "no-referrer");
	res.setHeader("X-DNS-Prefetch-Control", "off");
	res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
	res.setHeader(
		"Permissions-Policy",
		"camera=(), microphone=(), geolocation=()",
	);
	res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
	res.setHeader("Cross-Origin-Resource-Policy", "same-site");
	res.setHeader(
		"Content-Security-Policy",
		"default-src 'none'; frame-ancestors 'none'; form-action 'none'; base-uri 'none'",
	);

	if (env.isProduction) {
		res.setHeader(
			"Strict-Transport-Security",
			"max-age=31536000; includeSubDomains",
		);
	}

	next();
}
