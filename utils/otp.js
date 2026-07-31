// Make a 6 digit code
export const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

// Expires the otp in 10 minutes
export const otpExpiry = () => new Date(Date.now() + 10 * 60 * 1000);

// Match the otp given by user safely
export const otpValid = (user, otp) => {
  if (!user || !user.otp || !user.otpExpiry) return false;

  // 1. Ensure string comparison (handles type mismatches and whitespace)
  const isOtpMatch = String(user.otp).trim() === String(otp).trim();

  // 2. Compare numeric timestamps for bulletproof date checking
  const isNotExpired = new Date(user.otpExpiry).getTime() > Date.now();

  return isOtpMatch && isNotExpired;
};
