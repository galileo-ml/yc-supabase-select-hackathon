# Backend Service

## Prerequisites
- Python 3.11+ available on PATH (via Conda, pyenv, or system Python)
- [`uv`](https://github.com/astral-sh/uv#installation) installed for dependency and virtualenv management

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
This service currently exposes only the default health route. Expand within the `app/` package and update `pyproject.toml` when adding new modules.
