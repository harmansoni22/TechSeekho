const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginInput({ identifier, password }) {
	const normalizedIdentifier = (identifier ?? "").trim();
	const normalizedPassword = password ?? "";

	if (!normalizedIdentifier) {
		return {
			isValid: false,
			error: "Please enter your email or mobile number.",
		};
	}

	if (
		normalizedIdentifier.includes("@") &&
		!emailRegex.test(normalizedIdentifier)
	) {
		return {
			isValid: false,
			error: "Please enter a valid email address.",
		};
	}

	if (!normalizedPassword || normalizedPassword.length < 8) {
		return {
			isValid: false,
			error: "Password must be at least 8 characters.",
		};
	}

	return {
		isValid: true,
		error: "",
		normalized: {
			identifier: normalizedIdentifier,
			password: normalizedPassword,
		},
	};
}
