# Backend Service

## Prerequisites
- Python 3.11+ available on PATH (via Conda, pyenv, or system Python)
- [`uv`](https://github.com/astral-sh/uv#installation) installed for dependency and virtualenv management
- Resend API key (`RESEND_API_KEY`)
- Supabase project URL and service role key (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- Supabase Postgres connection string with DDL rights (`SUPABASE_DB_URL`)

## Setup
```bash
# from the repository root
cd backend

# create or refresh the project virtual environment
uv venv

# install runtime and dev dependencies
uv sync
```

If you prefer an existing Conda environment, activate it first and allow `uv` to manage the project-level `.venv` inside `backend/`.

## Running the API
```bash
# activate the virtual environment automatically and start FastAPI with reload
uv run uvicorn app.main:app --reload
```
The server listens on `http://127.0.0.1:8000/`. The root route (`/`) returns a JSON health payload.

## Testing
```bash
uv run pytest
```
Add tests under `app/tests/` to keep coverage alongside the code.

## Project Status
The service currently exposes a health endpoint, the Resend test email route, and Supabase seeding. Expand within the `app/` package and update `pyproject.toml` when adding new modules.
