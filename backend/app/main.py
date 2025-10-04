import logging
import os
from datetime import datetime
from typing import Any, Dict, Iterable
from urllib.parse import parse_qsl, urlparse, urlencode, urlunparse

import resend
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field as PydanticField
from sqlalchemy import Column, DateTime, String, func, text
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


class Campaign(SQLModel, table=True):
    __tablename__ = "campaigns"

    id: int | None = Field(default=None, primary_key=True)
    num_users: int = Field(gt=0)
    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )


class CampaignMember(SQLModel, table=True):
    __tablename__ = "campaign_members"

    campaign_id: int = Field(foreign_key="campaigns.id", primary_key=True)
    employee_id: int = Field(foreign_key="employees.id", primary_key=True)
    assigned_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )


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


class CreateCampaignRequest(BaseModel):
    num_users: int = PydanticField(gt=0, description="Number of employees to include")


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


def ensure_tables_and_seed() -> None:
    engine = get_engine()
    if engine is None:
        return

    try:
        SQLModel.metadata.create_all(
            engine,
            tables=[Employee.__table__, Campaign.__table__, CampaignMember.__table__],
        )

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
    await run_in_threadpool(ensure_tables_and_seed)


@app.get("/")
async def read_root():
    return {"status": "ok"}


def _create_campaign_record(num_users: int) -> tuple[Campaign, list[Employee]]:
    engine = get_engine()
    if engine is None:
        raise HTTPException(status_code=503, detail="Database connection is not configured")

    with Session(engine) as session:
        employees = session.exec(
            select(Employee).order_by(func.random()).limit(num_users)
        ).all()

        if len(employees) < num_users:
            raise HTTPException(
                status_code=400,
                detail="Not enough employees available to create campaign",
            )

        campaign = Campaign(num_users=num_users)
        session.add(campaign)
        session.flush()

        memberships = [
            CampaignMember(campaign_id=campaign.id, employee_id=employee.id)
            for employee in employees
        ]
        session.add_all(memberships)
        session.commit()
        session.refresh(campaign)

        return campaign, employees


@app.post("/campaigns", status_code=201)
async def create_campaign(payload: CreateCampaignRequest):
    campaign, employees = await run_in_threadpool(
        _create_campaign_record, payload.num_users
    )

    campaign_payload = {
        "id": campaign.id,
        "num_users": campaign.num_users,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
    }

    members_payload = [
        {
            "id": employee.id,
            "email": employee.email,
            "name": employee.name,
            "company": employee.company,
            "context": employee.context,
        }
        for employee in employees
    ]

    return {"campaign": campaign_payload, "members": members_payload}


def _load_campaign_and_members(campaign_id: int) -> tuple[Campaign, list[Employee]]:
    engine = get_engine()
    if engine is None:
        raise HTTPException(status_code=503, detail="Database connection is not configured")

    with Session(engine) as session:
        campaign = session.get(Campaign, campaign_id)
        if campaign is None:
            raise HTTPException(status_code=404, detail="Campaign not found")

        members = session.exec(
            select(Employee)
            .join(CampaignMember, CampaignMember.employee_id == Employee.id)
            .where(CampaignMember.campaign_id == campaign_id)
        ).all()

        return campaign, members


def _normalize_resend_collection(raw: Any) -> list[Dict[str, Any]]:
    if isinstance(raw, dict):
        data = raw.get("data")
        if isinstance(data, list):
            return [item for item in data if isinstance(item, dict)]
        if isinstance(data, dict):
            return [data]

    data_attr = getattr(raw, "data", None)
    if isinstance(data_attr, list):
        return [item for item in data_attr if isinstance(item, dict)]

    if isinstance(raw, list):
        return [item for item in raw if isinstance(item, dict)]

    return []


def _collect_resend_statuses(
    addresses: Iterable[str],
) -> tuple[Dict[str, list[dict[str, Any]]], bool]:
    normalized_addresses = {address.lower() for address in addresses if address}
    if not normalized_addresses:
        return {}, False

    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        logger.info("RESEND_API_KEY missing; skipping Resend status lookup")
        return {}, False

    resend.api_key = api_key
    status_lookup: Dict[str, list[dict[str, Any]]] = {
        address: [] for address in normalized_addresses
    }

    for address in normalized_addresses:
        try:
            response = resend.Emails.list({"to": address})
        except Exception as exc:  # pragma: no cover - external API protection
            logger.error("Failed to list emails for %s via Resend: %s", address, exc)
            continue

        emails = _normalize_resend_collection(response)
        for email in emails:
            email_id = email.get("id")
            status = (email.get("status") or "").lower()
            sent_at = email.get("created_at") or email.get("sent_at")
            email_payload: dict[str, Any] = {
                "id": email_id,
                "subject": email.get("subject"),
                "status": status or None,
                "sent": status in {"sent", "delivered", "opened", "clicked"},
                "clicked": False,
                "sent_at": sent_at,
            }

            if email_id:
                try:
                    events_response = resend.Events.list({"email_id": email_id})
                except Exception as exc:  # pragma: no cover - external API protection
                    logger.warning(
                        "Unable to fetch Resend events for email %s: %s", email_id, exc
                    )
                else:
                    for event in _normalize_resend_collection(events_response):
                        event_type = (event.get("type") or "").lower()
                        if event_type in {"clicked", "click"}:
                            email_payload["clicked"] = True
                        if event_type in {"sent", "delivered"}:
                            email_payload["sent"] = True
                        if (
                            not email_payload.get("sent_at")
                            and event.get("created_at")
                        ):
                            email_payload["sent_at"] = event["created_at"]

            status_lookup[address].append(email_payload)

        status_lookup[address].sort(
            key=lambda item: item.get("sent_at") or "", reverse=True
        )

    return status_lookup, True


@app.get("/campaigns/{campaign_id}/status")
async def get_campaign_status(campaign_id: int):
    campaign, members = await run_in_threadpool(
        _load_campaign_and_members, campaign_id
    )

    email_statuses, lookup_available = await run_in_threadpool(
        _collect_resend_statuses, [member.email for member in members]
    )

    campaign_payload = {
        "id": campaign.id,
        "num_users": campaign.num_users,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
    }

    members_payload = []
    for member in members:
        email_records = email_statuses.get(member.email.lower(), [])
        members_payload.append(
            {
                "employee": {
                    "id": member.id,
                    "email": member.email,
                    "name": member.name,
                    "company": member.company,
                    "context": member.context,
                },
                "emails": email_records,
            }
        )

    return {
        "campaign": campaign_payload,
        "members": members_payload,
        "resend_lookup": {"available": lookup_available},
    }


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
