# 033 — Limpieza de dumps de depuración y gate del sandbox /library-v2

## Qué se hizo

1. **Borrados 6 JSON de la raíz** (`clannad_search.json`, `v_1723.json`, `v_2167.json`,
   `v_4059.json`, `v_4181.json`, `v_6351.json`): eran respuestas crudas de la API de
   Jikan guardadas a mano mientras se depuraba `scripts/resolve-franchise-data.mjs`
   (resolución de la franquicia Clannad). Nunca estuvieron trackeados.
2. **`.gitignore`**: nuevo bloque para dumps de Jikan (`/v_*.json`, `/clannad_search.json`)
   y, de paso, los artefactos de Playwright (`/test-results/`, `/playwright-report/`,
   `tests/e2e/.auth/`) que llegarán en la fase de e2e (doc 037).
3. **Gate del sandbox `/library-v2`**: `src/app/[locale]/library-v2/layout.tsx` ahora
   hace `notFound()` fuera de `NODE_ENV === "development"`.

## Por qué

- Los dumps son basura manual: sin ignorarlos, cualquier depuración futura del script
  volvería a dejarlos como untracked y podrían colarse en un commit.
- La ruta `/library-v2` es un banco de pruebas del prototipo desktop; los componentes
  de `src/features/library-v2/` **sí son producción** (los importa `(app)/layout.tsx`),
  pero la ruta sandbox no aporta nada en prod y estaba públicamente accesible
  (`force-dynamic`, con banner "prototype"). El gate en el layout cubre `/library-v2`
  y `/library-v2/[id]` con un solo cambio y conserva el sandbox en `pnpm dev`.

## Verificación

- `pnpm build && pnpm start` → `GET /es/library-v2` responde 404.
- En dev (`pnpm dev`) la ruta sigue funcionando.
