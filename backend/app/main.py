import base64
import hashlib
import hmac
import logging
import os
from datetime import datetime
from typing import Any, Dict, Iterable
from urllib.parse import parse_qsl, urlparse, urlencode, urlunparse

import resend
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field as PydanticField, ValidationError
from sqlalchemy import Column, DateTime, String, UniqueConstraint, func, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlmodel import Field, Session, SQLModel, create_engine, select

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

if not logging.getLogger().isEnabledFor(logging.INFO):
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)
    handler.setFormatter(
        logging.Formatter("%(levelname)s %(name)s: %(message)s")
    )
    logger.addHandler(handler)
    logger.propagate = False

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


class CampaignEmail(SQLModel, table=True):
    __tablename__ = "campaign_emails"
    __table_args__ = (
        UniqueConstraint("campaign_id", "employee_id", name="uq_campaign_email_recipient"),
    )

    id: int | None = Field(default=None, primary_key=True)
    campaign_id: int = Field(foreign_key="campaigns.id", nullable=False)
    employee_id: int = Field(foreign_key="employees.id", nullable=False)
    recipient_email: str = Field(
        sa_column=Column(String, nullable=False, index=True)
    )
    subject: str | None = None
    resend_message_id: str | None = Field(
        default=None,
        sa_column=Column(String, unique=True, nullable=True, index=True),
    )
    status: str = Field(default="queued")
    last_event: str | None = None
    last_event_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    created_at: datetime | None = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
        ),
    )
    sent_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    delivered_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    opened_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    clicked_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    bounced_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
    complained_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
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


class ResendEvent(BaseModel):
    type: str
    created_at: datetime | None = None
    data: Dict[str, Any] | None = None
    object: str | None = None

    class Config:
        extra = "allow"


class ResendWebhookEnvelope(BaseModel):
    type: str | None = None
    created_at: datetime | None = None
    data: Dict[str, Any] | None = None
    events: list[ResendEvent] | None = None

    class Config:
        extra = "allow"


_CAMPAIGN_EMAIL_STATUS_PRIORITY: Dict[str, int] = {
    "queued": 10,
    "sending": 20,
    "sent": 30,
    "delivered": 40,
    "opened": 50,
    "clicked": 60,
    "bounced": 70,
    "complained": 80,
    "failed": 90,
}


_EVENT_STATUS_UPDATES: Dict[str, tuple[str, str | None]] = {
    "email.created": ("queued", None),
    "email.sending": ("sending", None),
    "email.sent": ("sent", "sent_at"),
    "email.delivered": ("delivered", "delivered_at"),
    "email.opened": ("opened", "opened_at"),
    "email.clicked": ("clicked", "clicked_at"),
    "email.bounced": ("bounced", "bounced_at"),
    "email.complained": ("complained", "complained_at"),
    "email.failed": ("failed", None),
}


_RESEND_WEBHOOK_EVENTS: list[str] = [
    "email.sent",
    "email.delivered",
    "email.opened",
    "email.clicked",
    "email.bounced",
    "email.complained",
]


_RESEND_WEBHOOK_SECRET_PLACEHOLDER = "replace-with-resend-webhook-secret"


def _ensure_row_level_security(engine: Engine, table_names: Iterable[str]) -> None:
    tables = list(table_names)
    try:
        with engine.begin() as connection:
            for table_name in tables:
                connection.execute(
                    text(f'ALTER TABLE IF EXISTS "{table_name}" ENABLE ROW LEVEL SECURITY')
                )
    except SQLAlchemyError as exc:  # pragma: no cover - database safeguard
        logger.warning("Unable to enable RLS for %s: %s", ", ".join(tables), exc)


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
            tables=[
                Employee.__table__,
                Campaign.__table__,
                CampaignMember.__table__,
                CampaignEmail.__table__,
            ],
        )
        _ensure_row_level_security(
            engine,
            (
                Employee.__tablename__,
                Campaign.__tablename__,
                CampaignMember.__tablename__,
                CampaignEmail.__tablename__,
            ),
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
    await run_in_threadpool(ensure_resend_webhook_registration)


@app.get("/")
async def read_root():
    return {"status": "ok"}


def _create_campaign_record(
    num_users: int,
) -> tuple[Campaign, list[Employee], list[CampaignEmail]]:
    engine = get_engine()
    if engine is None:
        raise HTTPException(status_code=503, detail="Database connection is not configured")

    with Session(engine, expire_on_commit=False) as session:
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

        email_records = [
            CampaignEmail(
                campaign_id=campaign.id,
                employee_id=employee.id,
                recipient_email=employee.email.lower(),
            )
            for employee in employees
        ]
        session.add_all(email_records)
        session.commit()
        session.refresh(campaign)

        return campaign, employees, email_records


def _serialize_campaign_email(record: CampaignEmail) -> dict[str, Any]:
    def _iso(value: datetime | None) -> str | None:
        return value.isoformat() if value else None

    return {
        "id": record.id,
        "campaign_id": record.campaign_id,
        "employee_id": record.employee_id,
        "recipient_email": record.recipient_email,
        "subject": record.subject,
        "resend_message_id": record.resend_message_id,
        "status": record.status,
        "last_event": record.last_event,
        "last_event_at": _iso(record.last_event_at),
        "created_at": _iso(record.created_at),
        "sent_at": _iso(record.sent_at),
        "delivered_at": _iso(record.delivered_at),
        "opened_at": _iso(record.opened_at),
        "clicked_at": _iso(record.clicked_at),
        "bounced_at": _iso(record.bounced_at),
        "complained_at": _iso(record.complained_at),
    }


def _enqueue_campaign_email_stub(email_payload: dict[str, Any]) -> None:
    logger.info(
        "Stub: enqueue marketing email %s for campaign %s to %s",
        email_payload.get("id"),
        email_payload.get("campaign_id"),
        email_payload.get("recipient_email"),
    )


@app.post("/campaigns", status_code=201)
async def create_campaign(
    payload: CreateCampaignRequest, background_tasks: BackgroundTasks
):
    campaign, employees, email_records = await run_in_threadpool(
        _create_campaign_record, payload.num_users
    )

    campaign_payload = {
        "id": campaign.id,
        "num_users": campaign.num_users,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
    }

    emails_by_employee: dict[int, list[CampaignEmail]] = {}
    for record in email_records:
        emails_by_employee.setdefault(record.employee_id, []).append(record)

    members_payload = []
    for employee in employees:
        employee_payload = {
            "id": employee.id,
            "email": employee.email,
            "name": employee.name,
            "company": employee.company,
            "context": employee.context,
        }
        email_payloads = [
            _serialize_campaign_email(record)
            for record in emails_by_employee.get(employee.id, [])
        ]
        members_payload.append(
            {
                "employee": employee_payload,
                "emails": email_payloads,
            }
        )

        for email_payload in email_payloads:
            background_tasks.add_task(_enqueue_campaign_email_stub, email_payload)

    return {"campaign": campaign_payload, "members": members_payload}


def _load_campaign_snapshot(
    campaign_id: int,
) -> tuple[Campaign, list[Employee], list[CampaignEmail]]:
    engine = get_engine()
    if engine is None:
        raise HTTPException(status_code=503, detail="Database connection is not configured")

    with Session(engine, expire_on_commit=False) as session:
        campaign = session.get(Campaign, campaign_id)
        if campaign is None:
            raise HTTPException(status_code=404, detail="Campaign not found")

        members = session.exec(
            select(Employee)
            .join(CampaignMember, CampaignMember.employee_id == Employee.id)
            .where(CampaignMember.campaign_id == campaign_id)
        ).all()

        emails = session.exec(
            select(CampaignEmail).where(CampaignEmail.campaign_id == campaign_id)
        ).all()

        return campaign, members, emails


def _status_priority(value: str | None) -> int:
    if not value:
        return -1
    return _CAMPAIGN_EMAIL_STATUS_PRIORITY.get(value, 0)


def _coerce_datetime(raw: Any) -> datetime | None:
    if isinstance(raw, datetime):
        return raw
    if isinstance(raw, str):
        candidate = raw.replace("Z", "+00:00") if raw.endswith("Z") else raw
        try:
            return datetime.fromisoformat(candidate)
        except ValueError:
            return None
    return None


def _iter_dicts(raw: Any) -> Iterable[Dict[str, Any]]:
    if isinstance(raw, dict):
        data = raw.get("data")
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    yield item
        elif isinstance(data, dict):
            yield data
        else:
            yield raw
    elif isinstance(raw, list):
        for item in raw:
            if isinstance(item, dict):
                yield item


def _extract_recipient_addresses(data: Dict[str, Any]) -> list[str]:
    candidates: list[str] = []
    for key in ("to", "recipient", "email", "address"):
        value = data.get(key)
        if not value:
            continue

        if isinstance(value, str):
            candidates.append(value)
        elif isinstance(value, dict):
            email_value = value.get("email") or value.get("address")
            if isinstance(email_value, str):
                candidates.append(email_value)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, str):
                    candidates.append(item)
                elif isinstance(item, dict):
                    email_value = item.get("email") or item.get("address")
                    if isinstance(email_value, str):
                        candidates.append(email_value)

    normalized = []
    seen = set()
    for address in candidates:
        lowered = address.lower()
        if lowered not in seen:
            seen.add(lowered)
            normalized.append(lowered)
    return normalized


def _get_resend_webhook_secret() -> str:
    return os.getenv("RESEND_WEBHOOK_SECRET", _RESEND_WEBHOOK_SECRET_PLACEHOLDER)


def _decode_signature(signature: str) -> bytes | None:
    signature = signature.strip()
    try:
        return bytes.fromhex(signature)
    except ValueError:
        pass

    try:
        return base64.b64decode(signature, validate=True)
    except Exception:
        return None


def _verify_resend_signature(raw_body: bytes, signature_header: str | None) -> bool:
    secret = _get_resend_webhook_secret()
    if not secret or secret == _RESEND_WEBHOOK_SECRET_PLACEHOLDER:
        logger.warning(
            "Resend webhook secret placeholder in use; skipping signature verification"
        )
        return True

    if not signature_header:
        logger.warning("Missing Resend signature header")
        return False

    timestamp: str | None = None
    signature_value: str | None = None

    parts = [segment.strip() for segment in signature_header.split(",") if segment.strip()]
    if parts:
        for part in parts:
            key, _, value = part.partition("=")
            key = key.strip().lower()
            value = value.strip()
            if key in {"t", "timestamp"}:
                timestamp = value
            elif key in {"s", "v1", "signature"}:
                signature_value = value

    if signature_value is None:
        signature_value = signature_header.strip()

    decoded_signature = _decode_signature(signature_value)
    if decoded_signature is None:
        logger.warning("Unable to decode Resend signature header")
        return False

    if timestamp:
        try:
            payload = f"{timestamp}.{raw_body.decode('utf-8')}".encode("utf-8")
        except UnicodeDecodeError:
            payload = timestamp.encode("utf-8") + b"." + raw_body
    else:
        payload = raw_body

    expected_signature = hmac.new(
        secret.encode("utf-8"), payload, hashlib.sha256
    ).digest()

    return hmac.compare_digest(decoded_signature, expected_signature)


def _locate_campaign_email(
    session: Session,
    message_id: str | None,
    addresses: list[str],
    metadata: Dict[str, Any],
) -> CampaignEmail | None:
    if message_id:
        email_record = session.exec(
            select(CampaignEmail).where(CampaignEmail.resend_message_id == message_id)
        ).first()
        if email_record is not None:
            return email_record

    campaign_email_id = metadata.get("campaign_email_id")
    if campaign_email_id is not None:
        try:
            candidate_id = int(campaign_email_id)
        except (TypeError, ValueError):
            candidate_id = None
        if candidate_id is not None:
            email_record = session.get(CampaignEmail, candidate_id)
            if email_record is not None:
                return email_record

    for address in addresses:
        email_record = session.exec(
            select(CampaignEmail)
            .where(CampaignEmail.recipient_email == address)
            .order_by(CampaignEmail.created_at.desc())
        ).first()
        if email_record is not None:
            return email_record

    return None


def _process_resend_event(event: ResendEvent) -> bool:
    engine = get_engine()
    if engine is None:
        logger.warning("Skipping Resend event processing because database is unavailable")
        return False

    event_type = (event.type or "").lower()
    data = event.data or {}
    metadata_raw = data.get("metadata")
    metadata = metadata_raw if isinstance(metadata_raw, dict) else {}

    message_id = data.get("email_id") or data.get("id") or data.get("message_id")
    if isinstance(message_id, dict):
        message_id = message_id.get("id") or message_id.get("email_id")

    addresses = _extract_recipient_addresses(data)
    event_timestamp = event.created_at or _coerce_datetime(data.get("created_at"))

    with Session(engine, expire_on_commit=False) as session:
        email_record = _locate_campaign_email(session, message_id, addresses, metadata)
        if email_record is None:
            logger.warning(
                "Received Resend event %s but could not match to a campaign email (message_id=%s, addresses=%s)",
                event_type,
                message_id,
                addresses,
            )
            return False

        if message_id and not email_record.resend_message_id:
            email_record.resend_message_id = message_id

        subject = data.get("subject")
        if isinstance(subject, str):
            email_record.subject = subject

        status_update = _EVENT_STATUS_UPDATES.get(event_type)
        if status_update:
            new_status, timestamp_attr = status_update
            if _status_priority(new_status) >= _status_priority(email_record.status):
                email_record.status = new_status
            if timestamp_attr and event_timestamp:
                setattr(email_record, timestamp_attr, event_timestamp)

        if event_timestamp:
            email_record.last_event_at = event_timestamp
        email_record.last_event = event_type

        session.add(email_record)
        session.commit()
        logger.info(
            "Processed Resend event %s; campaign_email_id=%s status=%s",
            event_type,
            email_record.id,
            email_record.status,
        )
        return True


def ensure_resend_webhook_registration() -> None:
    api_key = os.getenv("RESEND_API_KEY")
    target_url = os.getenv("RESEND_WEBHOOK_URL")

    if not api_key or not target_url:
        logger.info("RESEND_WEBHOOK_URL not set; skipping automatic Resend webhook registration")
        return

    resend.api_key = api_key

    namespace = getattr(resend, "Webhooks", None) or getattr(resend, "webhooks", None)
    if namespace is None:
        logger.warning(
            "Resend SDK does not expose Webhooks namespace; manual registration required for %s",
            target_url,
        )
        return

    list_method = getattr(namespace, "list", None)
    create_method = getattr(namespace, "create", None)

    if not callable(create_method):
        logger.warning(
            "Resend SDK does not support Webhooks.create; unable to auto-register webhook"
        )
        return

    if callable(list_method):
        try:
            existing_response = list_method()
        except Exception as exc:  # pragma: no cover - external API protection
            logger.warning("Unable to list existing Resend webhooks: %s", exc)
        else:
            for item in _iter_dicts(existing_response):
                if item.get("url") == target_url:
                    logger.info("Resend webhook already registered for %s", target_url)
                    return

    try:
        create_method(
            {
                "url": target_url,
                "events": _RESEND_WEBHOOK_EVENTS,
            }
        )
    except Exception as exc:  # pragma: no cover - external API protection
        logger.error(
            "Failed to register Resend webhook for %s: %s", target_url, exc
        )
    else:
        logger.info("Registered Resend webhook for %s", target_url)




@app.get("/campaigns/{campaign_id}/status")
async def get_campaign_status(campaign_id: int):
    campaign, members, emails = await run_in_threadpool(
        _load_campaign_snapshot, campaign_id
    )

    campaign_payload = {
        "id": campaign.id,
        "num_users": campaign.num_users,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
    }

    emails_by_employee: dict[int, list[CampaignEmail]] = {}
    for record in emails:
        emails_by_employee.setdefault(record.employee_id, []).append(record)

    members_payload = []
    for member in members:
        email_records = [
            _serialize_campaign_email(record)
            for record in emails_by_employee.get(member.id, [])
        ]
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

    return {"campaign": campaign_payload, "members": members_payload}


@app.post("/webhooks/resend", status_code=202)
async def handle_resend_webhook(request: Request):
    raw_body = await request.body()
    signature_header = (
        request.headers.get("resend-signature")
        or request.headers.get("x-resend-signature")
        or request.headers.get("Resend-Signature")
    )

    if not _verify_resend_signature(raw_body, signature_header):
        raise HTTPException(status_code=400, detail="Invalid Resend signature")

    try:
        payload = ResendWebhookEnvelope.model_validate_json(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, ValidationError) as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook payload") from exc

    events: list[ResendEvent] = []
    if payload.events:
        events.extend(payload.events)
    elif payload.type:
        events.append(
            ResendEvent(
                type=payload.type,
                created_at=payload.created_at,
                data=payload.data,
            )
        )

    if not events:
        logger.warning("Received Resend webhook with no events or type")
        return {"status": "ignored", "processed": 0}

    processed = 0
    for event in events:
        updated = await run_in_threadpool(_process_resend_event, event)
        if updated:
            processed += 1

    return {"status": "accepted", "processed": processed}


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
