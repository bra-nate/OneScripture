"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateEmail, validatePassword } from "@/lib/auth/validation";

export async function signUp(
  formData: FormData,
): Promise<{ error?: string; checkEmail?: boolean }> {
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

export async function signIn(formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const err = validateEmail(email) ?? validatePassword(password);
  if (err) return { error: err };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
