import logging
import os
from urllib.parse import parse_qsl, urlparse, urlencode, urlunparse

import resend
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy import Column, String, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlmodel import Field, Session, SQLModel, create_engine, select

logger = logging.getLogger(__name__)

app = FastAPI()

_engine: Engine | None = None


class Employee(SQLModel, table=True):
    __tablename__ = "employees"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(
        sa_column=Column("email", String, unique=True, nullable=False, index=True)
    )
    name: str
    company: str
    context: str | None = None


EMPLOYEE_SEED_DATA = [
    {
        "email": "nickcar712@gmail.com",
        "name": "Nick Mecklenburg",
        "company": "Microsoft",
        "context": "Tech lead at CoreAI post-training, hill-climbing on benchmarks like browsecomp, swebench-verified, etc. Participant at Supabase Select Hackathon.",
    },
    {
        "email": "cjache@berkeley.edu",
        "name": "Cjache Kang",
        "company": "CloudCruise",
        "context": "Engineer #1 at CloudCruise, a YC company. Works on prompting and AI applications for browser automations.",
    },
]


def _normalize_connection_url(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    parts = list(parsed)

    parts[0] = {
        "postgres": "postgresql+psycopg",
        "postgresql": "postgresql+psycopg",
        "postgresql+psycopg2": "postgresql+psycopg",
    }.get(parsed.scheme, parsed.scheme)

    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query.setdefault("sslmode", "require")
    parts[4] = urlencode(query)

    return urlunparse(parts)


def _init_engine() -> Engine | None:
    candidates: list[tuple[str, str]] = []
    for label, env_key in (("IPv6", "SUPABASE_URL_IPV6"), ("IPv4", "SUPABASE_URL_IPV4")):
        raw_url = os.getenv(env_key)
        if raw_url:
            candidates.append((label, raw_url))

    if not candidates:
        logger.warning("No SUPABASE_URL_IPV6 or SUPABASE_URL_IPV4 provided; skipping database setup")
        return None

    for label, raw_url in candidates:
        try:
            normalized = _normalize_connection_url(raw_url)
            engine = create_engine(normalized, pool_pre_ping=True)
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            logger.info("Connected to Supabase via %s endpoint", label)
            return engine
        except OperationalError as exc:
            logger.warning(
                "Supabase %s endpoint unreachable, falling back if possible: %s", label, exc
            )
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.error("Unexpected error using Supabase %s endpoint: %s", label, exc)

    logger.error("Unable to establish Supabase connection via provided URLs")
    return None


def get_engine() -> Engine | None:
    global _engine

    if _engine is None:
        _engine = _init_engine()

    return _engine


def ensure_employees_table_and_seed() -> None:
    engine = get_engine()
    if engine is None:
        return

    try:
        SQLModel.metadata.create_all(engine, tables=[Employee.__table__])

        with Session(engine) as session:
            existing = session.exec(select(Employee).limit(1)).first()
            if existing:
                logger.info("Employees table already populated; skipping seed")
                return

            employees = [Employee(**record) for record in EMPLOYEE_SEED_DATA]
            session.add_all(employees)
            session.commit()
            logger.info("Seeded %d employee records", len(employees))
    except SQLAlchemyError as exc:  # pragma: no cover - database safeguard
        logger.error("Database error while ensuring employees table: %s", exc)
    except Exception as exc:  # pragma: no cover - defensive catch-all
        logger.error("Unexpected error while seeding employees: %s", exc)


@app.on_event("startup")
async def startup_tasks() -> None:
    await run_in_threadpool(ensure_employees_table_and_seed)


@app.get("/")
async def read_root():
    return {"status": "ok"}


def _send_test_email(api_key: str) -> None:
    resend.api_key = api_key
    resend.Emails.send(
        {
            "from": "Chris Pennington <chris@reseend.com>",
            "to": ["nickcar712@gmail.com"],
            "subject": "FastAPI test email",
            "html": "<p>This is a test message triggered from /test_email.</p> Also, <a href='https://www.google.com'>here</a> is a link.",
        }
    )


@app.post("/test_email")
async def send_test_email(background_tasks: BackgroundTasks):
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, detail="RESEND_API_KEY environment variable not set"
        )

    background_tasks.add_task(_send_test_email, api_key)
    return {"status": "queued", "recipient": "nickcar712@gmail.com"}
