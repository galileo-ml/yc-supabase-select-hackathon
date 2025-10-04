import logging
import os
from typing import Optional

import resend
from fastapi import BackgroundTasks, FastAPI, HTTPException
from supabase import Client, create_client

logger = logging.getLogger(__name__)

app = FastAPI()

supabase_client: Optional[Client] = None

EMPLOYEE_SEED_DATA = [
    {
        "email": "nickcar712@gmail.com",
        "name": "Nick Mecklenburg",
        "company": "YC Supabase Select",
        "context": "Hackathon project steward.",
    },
    {
        "email": "team@example.com",
        "name": "Core Team",
        "company": "YC Supabase Select",
        "context": "Internal testing contact.",
    },
]


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
