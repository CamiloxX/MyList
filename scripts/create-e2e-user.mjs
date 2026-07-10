// Creates (or resets) the dedicated Playwright test account and appends the
// credentials to .env.local when missing. Idempotent — safe to re-run:
//   node scripts/create-e2e-user.mjs
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(import.meta.dirname, "..");
process.loadEnvFile(path.join(ROOT, ".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const email = process.env.E2E_EMAIL ?? "e2e@mylist.test";
const password = process.env.E2E_PASSWORD ?? randomBytes(12).toString("hex");

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

// Find an existing account first so re-runs reset the password instead of failing.
const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (listError) {
  console.error("listUsers failed:", listError.message);
  process.exit(1);
}
const existing = list.users.find((u) => u.email === email);

if (existing) {
  const { error } = await admin.auth.admin.updateUserById(existing.id, { password });
  if (error) {
    console.error("updateUserById failed:", error.message);
    process.exit(1);
  }
  console.log(`e2e user already existed — password reset (${email})`);
} else {
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("createUser failed:", error.message);
    process.exit(1);
  }
  console.log(`e2e user created (${email})`);
}

if (!process.env.E2E_EMAIL) {
  appendFileSync(
    path.join(ROOT, ".env.local"),
    `\n# Cuenta dedicada para los tests e2e de Playwright (scripts/create-e2e-user.mjs)\nE2E_EMAIL=${email}\nE2E_PASSWORD=${password}\n`,
  );
  console.log("credentials appended to .env.local");
} else {
  console.log("credentials already present in .env.local");
}
