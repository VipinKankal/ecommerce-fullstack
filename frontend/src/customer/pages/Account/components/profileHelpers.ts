export const validateProfileDetails = (fullName: string, mobileNumber: string) => {
  const errors: { fullName?: string; mobileNumber?: string } = {};

  if (!fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }

  if (!mobileNumber.trim()) {
    errors.mobileNumber = "Mobile number is required.";
  } else if (!/^[0-9]{10}$/.test(mobileNumber.trim())) {
    errors.mobileNumber = "Mobile number must be 10 digits.";
  }

  return errors;
};

export const resolveEmailFlowMessage = (value: unknown, fallback: string) => {
  const rawMessage =
    typeof value === "string"
      ? value
      : (value as { message?: string } | null)?.message || fallback;
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("already in use")) {
    return { type: "flow" as const, message: "This email already exists." };
  }
  if (normalizedMessage.includes("invalid otp") || normalizedMessage.includes("wrong otp")) {
    return { type: "otp" as const, message: "Wrong OTP. Please enter the correct 6-digit OTP." };
  }
  if (normalizedMessage.includes("otp expired") || normalizedMessage.includes("expired")) {
    return { type: "otp" as const, message: "OTP expired. Request a new OTP and try again." };
  }
  if (normalizedMessage.includes("different from current email")) {
    return { type: "flow" as const, message: "New email must be different from current email." };
  }

  return { type: "flow" as const, message: rawMessage };
};
