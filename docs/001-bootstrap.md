# 001 — Bootstrap del proyecto

**Fecha:** 2026-05-09
**Hito:** 1 (MVP usable)

## Qué se hizo

Inicialización del proyecto con `create-next-app@latest` + ajustes finos.

- `pnpm create next-app` con flags: `--typescript --tailwind --app --src-dir
  --import-alias "@/*" --use-pnpm --no-eslint --no-git --turbopack`.
- Como npm no permite mayúsculas en `name`, se scaffoldeó en una subcarpeta
  `mylist/` y luego se movieron los archivos al raíz `D:\DescargasCamilo\MyList`.
- TS strict reforzado con `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames` y
  `target: "ES2022"`.
- `lang="es"` y metadata en español en `src/app/layout.tsx`.
- Aprobados los build scripts nativos `sharp` y `unrs-resolver` en
  `pnpm-workspace.yaml` (`allowBuilds`).
- Sin ESLint: usaremos Biome (ver doc 002).

## Por qué

- **Next 16** en lugar de 15: `create-next-app@latest` instala la versión
  estable actual; Next 16 es casi 100% retrocompatible con 15 y trae mejoras
  en Turbopack.
- **Sin ESLint**: Biome es más rápido, una sola config y menos dependencias.
- **TS strict reforzado**: catchea bugs comunes (acceso a índices, switches
  sin break, etc.) sin coste de DX significativo.
- **Sharp aprobado**: optimización de imágenes nativa en producción; sin él,
  Next cae a una implementación JS más lenta.

## Verificación

- `pnpm exec tsc --noEmit` → sin errores.
- `pnpm build` → build exitoso, página `/` y `/_not-found` generadas estáticamente.

## Notas

- El nombre del paquete en `package.json` es `mylist` (lowercase) por
  restricción de npm, aunque la carpeta es `MyList`.
- `pnpm-workspace.yaml` se usa solo para configurar `allowBuilds`, no para
  un monorepo real.
