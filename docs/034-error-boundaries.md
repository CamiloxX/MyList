# 034 — Error boundaries con ErrorState compartido

## Qué se hizo

Hasta ahora la app no tenía **ningún** `error.tsx` ni `global-error.tsx`: cualquier
error de render no capturado tumbaba la página entera sin fallback. Se añadió:

| Archivo | Cubre |
|---|---|
| `src/app/global-error.tsx` | Errores que escapan del layout raíz |
| `src/app/[locale]/error.tsx` | Rutas públicas (home, `/u/[username]`, `/share/[id]`) |
| `src/app/[locale]/(app)/error.tsx` | Todas las rutas del shell (library, stats, lists, …) — renderiza dentro del layout, así que sidebar/header siguen vivos |
| `src/app/[locale]/(auth)/error.tsx` | login/register |
| `src/app/[locale]/(app)/discover/error.tsx` | Contextual: Discover depende de TMDB + OMDb + Jikan, la causa más probable es un upstream caído y reintentar suele bastar |

Todos comparten `src/components/error-state.tsx` (icono + título + descripción +
botón *Reintentar* que llama `reset()` + link opcional a la biblioteca), con la
misma estética de borde dashed de los empty states. Textos en el namespace
`errors` de `es.json`/`en.json`.

## Excepción documentada: global-error.tsx

`global-error.tsx` **reemplaza el layout raíz entero**: renderiza su propio
`<html>/<body>`, importa `globals.css` él mismo y queda fuera de
`NextIntlClientProvider`. Por limitación de Next.js no puede usar `useTranslations`,
así que lleva un diccionario inline bilingüe de 3 strings y decide idioma leyendo
el prefijo de locale del pathname. Es la excepción sancionada a la regla
"UI siempre vía i18n".

## Extra: test de paridad i18n

`tests/unit/i18n-parity.test.ts` aplana recursivamente las claves de `es.json` y
`en.json` y falla listando exactamente qué claves faltan en cada lado. Protege la
paridad (~1100 claves) de forma permanente.

## Verificación

- `throw` temporal en una página de `(app)` → boundary con shell intacto; `reset()` re-renderiza.
- `pnpm build && pnpm start` para el caso `global-error` (solo visible en prod).
- `pnpm test` → paridad i18n en verde.
