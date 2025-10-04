# Backend Service

## Prerequisites
- Python 3.11+ available on PATH (Conda, pyenv, or system install)
- [`uv`](https://github.com/astral-sh/uv#installation) for dependency management
- Resend API key (`RESEND_API_KEY`)
- Supabase Postgres URLs (`SUPABASE_URL_IPV6`, `SUPABASE_URL_IPV4`) containing service credentials

## Setup
```bash
# from the repository root
cd backend
uv venv        # create or refresh the project virtual environment
uv sync        # install runtime and dev dependencies
```
Activate any Conda environment first if you rely on Conda for the base interpreter; `uv` will still manage the project-scoped `.venv` inside `backend/`.

## Environment
Export the credentials before running the server:
```bash
export RESEND_API_KEY="your_resend_api_key"
export SUPABASE_URL_IPV6="postgresql://user:password@ipv6-host:5432/postgres"
export SUPABASE_URL_IPV4="postgresql://user:password@ipv4-host:5432/postgres"
export RESEND_WEBHOOK_URL="https://your.public.domain/webhooks/resend"
export RESEND_WEBHOOK_SECRET="your_resend_webhook_secret"
export OPENAI_API_KEY="your_openai_api_key"
```
On Windows PowerShell:
```powershell
setx RESEND_API_KEY "your_resend_api_key"
setx SUPABASE_URL_IPV6 "postgresql://user:password@ipv6-host:5432/postgres"
setx SUPABASE_URL_IPV4 "postgresql://user:password@ipv4-host:5432/postgres"
setx RESEND_WEBHOOK_URL "https://your.public.domain/webhooks/resend"
setx RESEND_WEBHOOK_SECRET "your_resend_webhook_secret"
setx OPENAI_API_KEY "your_openai_api_key"
```
You can also load them from a local `.env` file with `set -o allexport && source .env && set +o allexport`.

## Running the API
```bash
uv run uvicorn app.main:app --reload
```
- `GET /` — returns a JSON health payload.
- `POST /test_email` — queues a Resend test email to `nickcar712@gmail.com` and returns `500` if `RESEND_API_KEY` is missing.

On startup the app tries the Supabase IPv6 connection first, falling back to IPv4 if needed. If `public.employees` is missing it is created, and whenever the table is empty the seed data (`email`, `name`, `company`, `context`) is inserted. Existing rows are left untouched.

## Testing
```bash
uv run pytest
```
Add tests under `app/tests/` to keep coverage alongside the codebase.

## Project Status
The service currently exposes a health endpoint, the Resend test-email route, and Supabase seeding logic. Extend within the `app/` package and update `pyproject.toml` when adding new modules.
