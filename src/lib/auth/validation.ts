/** Returns an error message, or null when the email is valid. */
export function validateEmail(email: string): string | null {
  if (!email) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Enter a valid email address.";
  return null;
}

/** Returns an error message, or null when the password is valid (length ≥ 6). */
export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  return null;
}
