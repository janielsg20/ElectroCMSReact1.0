# Seguridad

Estado: baseline; threat model detallado en F17.

- Validar schemas, versiones, rutas, MIME, tamaños y checksums de importaciones.
- Sanitizar código/HTML personalizado y escapar por contexto en cada destino.
- Prevenir XSS, CSRF, path traversal, SQL injection y zip bombs.
- Hash de contraseñas con algoritmo adecuado al destino; nunca texto plano.
- Denegar por defecto; verificar capacidades en casos de uso, no solo en UI.
- Backups y rollback antes de migraciones destructivas.

