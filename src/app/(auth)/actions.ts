"use server";

import { redirect } from "next/navigation";

import { getOAuthCallbackUrl, isOAuthProvider, type OAuthProvider } from "@/lib/auth/oauth";
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
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  // Email confirmation is ON — no session is created yet.
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
  redirect("/dashboard");
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
