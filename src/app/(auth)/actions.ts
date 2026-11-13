"use server";

import { redirect } from "next/navigation";

import { getOAuthCallbackUrl, isOAuthProvider, type OAuthProvider } from "@/lib/auth/oauth";
import { getPasswordRecoveryCallbackUrl } from "@/lib/auth/passwordRecovery";
import { validateEmail, validatePassword } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

type AuthActionResult = { error?: string; checkEmail?: boolean };

export async function signUp(
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const err = validateEmail(email) ?? validatePassword(password);
  if (err) return { error: err };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: getOAuthCallbackUrl() },
  });
  if (error) return { error: error.message };
  // Email confirmation is ON, so no session is created yet.
  return { checkEmail: true };
}

export async function signIn(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const err = validateEmail(email) ?? validatePassword(password);
  if (err) return { error: err };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/playlist");
}

export async function requestPasswordReset(
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "");
  const validationError = validateEmail(email);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordRecoveryCallbackUrl(),
  });

  if (error) {
    return { error: "We couldn't send a reset email. Please try again." };
  }

  return { checkEmail: true };
}

export async function updatePassword(
  formData: FormData,
): Promise<AuthActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");
  const validationError = validatePassword(password);
  if (validationError) return { error: validationError };
  if (password !== confirmation) return { error: "Passwords do not match." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "We couldn't update your password. Please try again." };

  await supabase.auth.signOut();
  redirect("/login?reset=success");
}

export async function signInWithOAuth(
  provider: OAuthProvider,
): Promise<AuthActionResult> {
  if (!isOAuthProvider(provider)) return { error: "Unsupported sign-in provider." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: getOAuthCallbackUrl() },
  });

  if (error) return { error: error.message };
  if (!data.url) return { error: "The sign-in provider did not return a redirect URL." };

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
