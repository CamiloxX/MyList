# 005 — Auth email/password

**Fecha:** 2026-05-09
**Hito:** 1
**Tarea:** 7

## Qué se hizo

### Backend / wiring

- `middleware.ts` (raíz): refresca el JWT de Supabase en cada request vía
  `updateSession` y aplica reglas de redirección:
  - Usuario autenticado en `/login` o `/register` → redirige a `/library`.
  - Usuario no autenticado intentando entrar a `/library`, `/search`, `/stats`,
    `/lists`, `/settings` → redirige a `/login?next=<ruta>`.
  - El matcher excluye estáticos y assets de imagen para no penalizar perf.
- `src/app/page.tsx`: home redirige a `/library` si hay sesión, a `/login` si no.
- `src/app/(app)/layout.tsx`: layout protegido que también valida sesión en el
  servidor (defensa en profundidad: el middleware es el filtro principal pero
  el layout asegura que aunque alguien bypaseara el middleware, RSC no
  devolvería contenido). Incluye un header con botón "Salir".

### Auth feature

```
src/features/auth/
├── schemas.ts                 # Zod: loginSchema, registerSchema
├── actions.ts                 # signIn, signUp, signOut (server actions)
└── components/
    ├── login-form.tsx         # Client; RHF + zod resolver + Sonner toasts
    └── register-form.tsx      # Client; igual + estado "revisa tu email"
```

- **Server Actions** retornan `ActionFailure | undefined`:
  - On éxito → `redirect()` (lanza `NEXT_REDIRECT`, el cliente nunca recibe
    valor). El form solo necesita manejar el caso de error.
  - `translateAuthError` convierte mensajes técnicos de Supabase a español
    amigable (credenciales inválidas, email no confirmado, etc.).
- **Forms** usan `useTransition` para deshabilitar el botón mientras la action
  corre y muestran errores tanto a nivel campo (RHF `setError`) como toast.

### Toaster + ThemeProvider

- `src/app/layout.tsx`: ahora monta `<ThemeProvider>` (next-themes, peer
  requerido por sonner) y `<Toaster />` al raíz.
- `src/components/theme-provider.tsx`: wrapper Client Component sobre
  `next-themes` para usar dentro de RSC root layout.

## Verificación funcional

Probado con dev server (`pnpm dev`):

| Ruta | Esperado | Resultado |
|---|---|---|
| `GET /login` | 200, render form | ✓ 200 |
| `GET /register` | 200, render form | ✓ 200 |
| `GET /library` (sin sesión) | 307 → `/login?next=/library` | ✓ 307 |
| `GET /` (sin sesión) | 307 → `/login` | ✓ 307 |

**Falta probar manualmente** (requiere navegador):
- Crear cuenta con email + password (con email confirmation OFF en Supabase).
- Iniciar sesión y llegar a `/library`.
- Verificar que el botón "Salir" termina la sesión.
- Verificar que el trigger `handle_new_user` creó la fila en `profiles`.

## Configuración requerida en Supabase

Para que el flujo de signup funcione sin clic en email, ir al dashboard:

1. **Authentication → Providers → Email**
2. Bajar a "Confirm email" → **toggle OFF**
3. Save

Con email confirmation ON, el flujo igual funciona pero el usuario debe
clickear el link del email antes de poder iniciar sesión. El form ya muestra
un mensaje "Revisa tu email" en ese caso.

## Notas / decisiones

- **i18n diferida a Hito 3**: las strings de UI están hardcodeadas en español
  por ahora. Cuando llegue Hito 3 reemplazamos con `next-intl` y movemos a
  `messages/es.json`. La regla de "UI siempre vía i18n" del CLAUDE.md aplica
  desde ese punto; en Hito 1 lo aceptamos como deuda explícita para no
  inflar el MVP.
- **Sin Google OAuth todavía**: el plan original lo movió a Hito 2.
- **Defensa en profundidad** en `(app)/layout.tsx`: además del middleware,
  el server layout también valida sesión. Cuesta una llamada extra pero evita
  cualquier ruta huérfana si el matcher cambia.
