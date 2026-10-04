# InkVault — Development Notes

## Architecture
- **Frontend**: Vite + React (port 5173, exposed on host port 3000)
- **Backend**: Express + better-sqlite3 (port 8000, internal)
- **Database**: SQLite at `/app/data/vault.db` (named volume `vault_data`)
- **File storage**: Uploaded files stored privately on disk at `/app/uploads` (named volume `vault_uploads`) — no public URLs; files served only through the download API endpoint.

## Development
- `docker compose -f docker-compose.base44.yml up -d --build` starts both services.
- Frontend proxies `/api` to the backend via Vite config (single-origin wiring).
- Backend uses `node --watch` for live reload; frontend uses Vite HMR.
- Both services run `npm install` on startup from the bind-mounted source.

## Data Model
- **records**: `id` (UUID), `title`, `notes`, `created_at`, `updated_at`
- **files**: `id` (UUID), `record_id` (FK → records), `filename`, `mime_type`, `size`, `storage_path`, `created_at`

## API Endpoints
- `GET /api/records` — list all records with their files
- `POST /api/records` — create a record (`{ title, notes }`)
- `PUT /api/records/:id` — update title/notes
- `DELETE /api/records/:id` — delete record and its files
- `POST /api/records/:id/files` — upload files (multipart `files` field)
- `GET /api/files/:id/download` — download a file (private)
- `DELETE /api/files/:id` — delete a file
