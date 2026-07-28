// Make a 6 digit code
export const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

// Expires the otp in 10 minutes
export const otpExpiry = () => new Date(Date.now() + 10 * 60 * 1000);

// Match the otp given by user
export const otpValid = (user, otp) =>
  user.otp === otp && user.otpExpiry && user.otpExpiry > new Date();
