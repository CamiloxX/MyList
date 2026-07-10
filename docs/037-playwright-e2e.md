# 037 — Playwright: tests e2e de los flujos críticos

## Qué se hizo

Playwright estaba en el stack aprobado (Hito 2) pero nunca se configuró.
Setup mínimo viable, desktop-only:

- `playwright.config.ts`: project `setup` (login UI → guarda `storageState` en
  `tests/e2e/.auth/user.json`, gitignored) + project `chromium` (Desktop Chrome)
  que depende de él. `webServer` levanta **`next start -p 3210`** (server de
  producción en puerto dedicado). Serial (`workers: 1`) porque los specs
  comparten la cuenta de prueba.
- **Cuenta e2e dedicada** (`e2e@mylist.test`): la crea/reinicia
  `scripts/create-e2e-user.mjs` (admin API con service role; añade
  `E2E_EMAIL`/`E2E_PASSWORD` a `.env.local`). RLS aísla sus datos de las
  cuentas reales.
- `tests/e2e/helpers.ts`: cliente service-role **solo para tests** —
  `clearLibrary` (limpieza self-healing en beforeEach) y `seedInterstellar`.
- Specs:
  1. `auth-login.spec.ts` — login OK redirige a library; credenciales malas
     muestran toast y no navegan.
  2. `add-title.spec.ts` — busca "Interstellar" en `/es/search`, pulsa
     "Agregar", espera toast + botón "Agregado".
  3. `library-detail.spec.ts` — con ítem sembrado, la biblioteca lo muestra y
     navega al detalle.
- Scripts: `pnpm test:e2e` / `pnpm test:e2e:ui`.

## Decisiones

- **Contra build de producción local, no `next dev` ni prod remoto**: los specs
  mutan datos (descartado prod, que además auto-deploya), y en esta máquina el
  disco D:\ hace que `next dev` tarde 3+ min en compilar en frío y agote el
  runner. `next start` arranca en segundos y valida exactamente lo que se
  deploya. **Prerequisito: `pnpm build` reciente** (next start sirve el último
  build).
- **Puerto dedicado 3210**: el 3000 suele estar ocupado por dev servers de
  otros proyectos (el primer intento reutilizó "PlayStoreMap" por accidente).
- **Solo desktop en el MVP**: el shell bifurca por User-Agent y los selectores
  móviles son otros — specs móviles quedan como iteración futura.
- Vitest no recoge los e2e (su `include` se limita a `tests/unit/**`).

## Verificación

`pnpm build && pnpm test:e2e` → 5/5 en verde (24 s); `pnpm test` (unit) sigue verde.
