const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9]{8,15}$/;
const otpRegex = /^[0-9]{4,6}$/;

export function validateSignupInput({
    name,
    email,
    phone,
    otp,
    password,
    confirmPassword,
}) {
    const normalizedName = (name ?? "").trim();
    const normalizedEmail = (email ?? "").trim().toLowerCase();
    const normalizedPhone = (phone ?? "").trim();
    const normalizedOtp = (otp ?? "").trim();
    const normalizedPassword = password ?? "";
    const normalizedConfirmPassword = confirmPassword ?? "";

    if (!normalizedName) {
        return { isValid: false, error: "Please enter your full name." };
    }

    if (normalizedName.length < 2) {
        return { isValid: false, error: "Name must be at least 2 characters." };
    }

    if (!normalizedEmail) {
        return { isValid: false, error: "Please enter your email address." };
    }

    if (!emailRegex.test(normalizedEmail)) {
        return { isValid: false, error: "Please enter a valid email address." };
    }

    if (!normalizedPhone) {
        return { isValid: false, error: "Please enter your mobile number." };
    }

    if (!phoneRegex.test(normalizedPhone)) {
        return {
            isValid: false,
            error: "Please enter a valid mobile number including country code (e.g. +92...).",
        };
    }

    if (!normalizedPassword || normalizedPassword.length < 8) {
        return {
            isValid: false,
            error: "Password must be at least 8 characters.",
        };
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
        return { isValid: false, error: "Passwords do not match." };
    }

    if (normalizedOtp && !otpRegex.test(normalizedOtp)) {
        return { isValid: false, error: "Please enter a valid 4-6 digit OTP." };
    }

    return {
        isValid: true,
        error: "",
        normalized: {
            name: normalizedName,
            email: normalizedEmail,
            phone: normalizedPhone,
            password: normalizedPassword,
        },
    };
}
