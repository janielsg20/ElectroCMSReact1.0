# CI/CD — GitHub Actions y Cloudflare Pages

## Arquitectura

- Repositorio objetivo: `janielsg20/ElectroCMSReact1.0`, público.
- Rama de producción: `main`.
- Proyecto Pages: `electrocms-react`.
- Método: Direct Upload con `cloudflare/wrangler-action@v4` y Wrangler 4.
- Artefacto: `dist/`, generado una sola vez por el job de calidad y reutilizado por deploy.

## Pipeline

El workflow `.github/workflows/ci-cd.yml` se ejecuta en pull requests, pushes a `main` y manualmente:

1. `npm ci`.
2. `npm run lint`.
3. `npm run typecheck`.
4. `npm run test`.
5. `npm run build`.
6. Publicación del artefacto solo en `main`.

El job usa permisos mínimos: `contents: read`; deploy añade únicamente `deployments: write`.

## Secretos requeridos en GitHub

- `CLOUDFLARE_ACCOUNT_ID`.
- `CLOUDFLARE_API_TOKEN`: token limitado a `Account / Cloudflare Pages / Edit` para la cuenta correspondiente.

Nunca se guardan estos valores en archivos, commits, logs o variables públicas.

## Estado operativo

- Repositorio público creado y `origin` enlazado.
- Proyecto Direct Upload `electrocms-react` creado.
- Secretos requeridos configurados en GitHub Actions.
- Primera ejecución completa verificada: `31332151380`.
- Producción verificada: `https://electrocms-react.pages.dev/` responde HTTPS 200.

## Nota irreversible

Cloudflare no permite convertir un proyecto Pages Direct Upload existente en Git Integration. Cambiar de método requiere crear otro proyecto Pages.

## Fuentes

- https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
- https://github.com/cloudflare/wrangler-action
- https://docs.github.com/actions
