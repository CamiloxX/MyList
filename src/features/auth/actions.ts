"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  type ChangePasswordInput,
  changePasswordSchema,
  type LoginInput,
  loginSchema,
  type RegisterInput,
  registerSchema,
} from "./schemas";

export type AuthErrorKey =
  | "reviewFields"
  | "invalidCredentials"
  | "emailNotConfirmed"
  | "userAlreadyRegistered"
  | "weakPassword"
  | "googleConnect"
  | "invalidEmail"
  | "passwordRequired"
  | "passwordMin"
  | "nameRequired"
  | "nameMax"
  | "currentPasswordWrong"
  | "newPasswordSameAsOld"
  | "passwordsDontMatch"
  | "confirmPasswordRequired"
  | "notSignedIn"
  | "noEmailOnAccount"
  | "updatePasswordFailed";

export type ActionFailure = {
  ok: false;
  errorKey: AuthErrorKey;
  fieldErrors?: Partial<Record<string, AuthErrorKey>>;
};
export type SignInSuccess = { ok: true; redirectTo: string };
export type SignUpSuccess =
  | { ok: true; status: "signed_in"; redirectTo: string }
  | { ok: true; status: "confirmation_sent" };
export type SignInResult = SignInSuccess | ActionFailure;
export type SignUpResult = SignUpSuccess | ActionFailure;

const ZOD_TO_KEY: Record<string, AuthErrorKey> = {
  "Email inválido": "invalidEmail",
  "Ingresa tu contraseña": "passwordRequired",
  "Mínimo 8 caracteres": "passwordMin",
  "Ingresa tu nombre": "nameRequired",
  "Máximo 50 caracteres": "nameMax",
  "Confirma tu contraseña": "confirmPasswordRequired",
  "Las contraseñas no coinciden": "passwordsDontMatch",
  "La nueva contraseña debe ser distinta": "newPasswordSameAsOld",
};

function mapFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): Partial<Record<string, AuthErrorKey>> {
  const result: Partial<Record<string, AuthErrorKey>> = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const first = messages?.[0];
    if (first && ZOD_TO_KEY[first]) {
      result[field] = ZOD_TO_KEY[first];
    }
  }
  return result;
}

export async function signIn(input: LoginInput): Promise<SignInResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errorKey: "reviewFields",
      fieldErrors: mapFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    console.warn("[signIn] supabase error:", error.message, error.status);
    return { ok: false, errorKey: translateAuthErrorKey(error.message) };
  }

  return { ok: true, redirectTo: "/library" };
}

export async function signUp(input: RegisterInput): Promise<SignUpResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errorKey: "reviewFields",
      fieldErrors: mapFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
    },
  });

  if (error) {
    console.warn("[signUp] supabase error:", error.message, error.status);
    // Don't reveal whether the email already has an account (enumeration).
    // Treat an "already registered" error as the same neutral outcome as a
    // fresh signup — the confirmation email is the only side channel.
    if (error.message.toLowerCase().includes("user already registered")) {
      return { ok: true, status: "confirmation_sent" };
    }
    return { ok: false, errorKey: translateAuthErrorKey(error.message) };
  }

  if (data.session) {
    return { ok: true, status: "signed_in", redirectTo: "/library" };
  }

  return { ok: true, status: "confirmation_sent" };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithGoogle(): Promise<SignInResult> {
  const supabase = await createClient();
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol =
    headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/library`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    console.warn("[signInWithGoogle] error:", error?.message);
    return { ok: false, errorKey: "googleConnect" };
  }

  return { ok: true, redirectTo: data.url };
}

function translateAuthErrorKey(message: string): AuthErrorKey {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "invalidCredentials";
  // Fold "email not confirmed" into the same generic key: distinguishing a
  // registered-but-unconfirmed email from an unknown one lets an attacker
  // enumerate accounts.
  if (lower.includes("email not confirmed")) return "invalidCredentials";
  if (lower.includes("user already registered")) return "userAlreadyRegistered";
  if (lower.includes("weak password")) return "weakPassword";
  return "reviewFields";
}

export type ChangePasswordResult = { ok: true } | ActionFailure;

/**
 * Verifies the current password by re-running signInWithPassword (which is the
 * only Supabase primitive that confirms a plaintext password belongs to the
 * user) and, on success, updates the password via auth.updateUser. Both calls
 * happen on the server with the user's session cookies, so RLS and audit trail
 * are intact.
 *
 * Returns a translated-error-key result instead of raw Supabase messages so
 * the form can render localized strings via next-intl.
 */
export async function changePassword(input: ChangePasswordInput): Promise<ChangePasswordResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errorKey: "reviewFields",
      fieldErrors: mapFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, errorKey: "notSignedIn" };
  if (!user.email) return { ok: false, errorKey: "noEmailOnAccount" };

  // Re-authenticate to confirm the user actually knows the current password.
  // Supabase replays this as a fresh sign-in and rotates the session cookies,
  // which is fine — the same user stays signed in.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (signInError) {
    return {
      ok: false,
      errorKey: "currentPasswordWrong",
      fieldErrors: { currentPassword: "currentPasswordWrong" },
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (updateError) {
    const lower = updateError.message.toLowerCase();
    if (lower.includes("weak password")) {
      return { ok: false, errorKey: "weakPassword", fieldErrors: { newPassword: "weakPassword" } };
    }
    if (lower.includes("same as the existing")) {
      return {
        ok: false,
        errorKey: "newPasswordSameAsOld",
        fieldErrors: { newPassword: "newPasswordSameAsOld" },
      };
    }
    return { ok: false, errorKey: "updatePasswordFailed" };
  }

  return { ok: true };
}
