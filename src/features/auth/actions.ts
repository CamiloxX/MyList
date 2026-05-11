"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { type LoginInput, loginSchema, type RegisterInput, registerSchema } from "./schemas";

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
  | "nameMax";

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
  console.warn("[signIn] received input:", {
    type: typeof input,
    isObject: input !== null && typeof input === "object",
    keys: input && typeof input === "object" ? Object.keys(input) : null,
    emailType: typeof (input as Record<string, unknown> | null)?.email,
    emailLen: ((input as Record<string, unknown> | null)?.email as string | undefined)?.length,
    passwordLen: ((input as Record<string, unknown> | null)?.password as string | undefined)?.length,
  });
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    console.warn("[signIn] zod failure:", JSON.stringify(parsed.error.flatten()));
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
  console.warn("[signUp] received input:", {
    type: typeof input,
    isObject: input !== null && typeof input === "object",
    keys: input && typeof input === "object" ? Object.keys(input) : null,
    emailType: typeof (input as Record<string, unknown> | null)?.email,
    emailLen: ((input as Record<string, unknown> | null)?.email as string | undefined)?.length,
    passwordLen: ((input as Record<string, unknown> | null)?.password as string | undefined)?.length,
    displayNameLen: ((input as Record<string, unknown> | null)?.displayName as string | undefined)
      ?.length,
  });
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    console.warn("[signUp] zod failure:", JSON.stringify(parsed.error.flatten()));
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
  if (lower.includes("email not confirmed")) return "emailNotConfirmed";
  if (lower.includes("user already registered")) return "userAlreadyRegistered";
  if (lower.includes("weak password")) return "weakPassword";
  return "reviewFields";
}
