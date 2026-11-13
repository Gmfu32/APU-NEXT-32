"""APU NEXT API: account access, student profiles, opportunity matching and requests."""
import base64
import calendar
import hashlib
import hmac
import html
import json
import os
import smtplib
import re
import secrets
import ssl
import uuid
from urllib import error as urllib_error
from urllib.parse import urlencode, urlparse
from urllib import request as urllib_request
from email.message import EmailMessage
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Literal

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import Boolean, DateTime, Integer, JSON, String, Text, create_engine, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column
from .programmes import PROGRAMMES, get_programme, infer_programme_id
from . import assistant_service

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./apu_next.db")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("sqlite:///./"):
    DATABASE_URL = f"sqlite:///{(BACKEND_DIR / DATABASE_URL.removeprefix('sqlite:///./')).resolve()}"
engine_options: dict[str, Any] = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, **engine_options)
# Use a process-local random key for development when none is configured. A
# deployment must set AUTH_SECRET to a stable, private value.
AUTH_SECRET = os.getenv("AUTH_SECRET") or secrets.token_urlsafe(48)
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads")).resolve()
EVENT_QR_PATH = BACKEND_DIR / "assets" / "event-qr.webp"
CAREERJET_API_URL = "https://search.api.careerjet.net/v4/query"


class Base(DeclarativeBase):
    pass


class Account(Base):
    __tablename__ = "accounts"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(20))
    password_salt: Mapped[str] = mapped_column(String(64))
    password_hash: Mapped[str] = mapped_column(String(128))
    employer_profile: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    approval_status: Mapped[str] = mapped_column(String(20), default="Approved")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Student(Base):
    __tablename__ = "students"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    data: Mapped[dict[str, Any]] = mapped_column(JSON)
    cv_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cv_file_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OpportunityRecord(Base):
    __tablename__ = "opportunities"
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    status: Mapped[str] = mapped_column(String(30), default="Approved")
    data: Mapped[dict[str, Any]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Match(Base):
    __tablename__ = "matches"
    id: Mapped[str] = mapped_column(String(200), primary_key=True)
    student_id: Mapped[str] = mapped_column(String(80), index=True)
    opportunity_id: Mapped[str] = mapped_column(String(100), index=True)
    score: Mapped[int] = mapped_column(Integer)
    components: Mapped[dict[str, int]] = mapped_column(JSON)
    reasons: Mapped[list[str]] = mapped_column(JSON)
    response: Mapped[str | None] = mapped_column(String(30), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StudentApplication(Base):
    __tablename__ = "student_applications"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    student_id: Mapped[str] = mapped_column(String(80), index=True)
    opportunity_id: Mapped[str] = mapped_column(String(100), index=True)
    status: Mapped[str] = mapped_column(String(30), default="Submitted")
    note: Mapped[str] = mapped_column(Text, default="")
    cv_share_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    applied_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ApprovalEvent(Base):
    __tablename__ = "approval_history"
    id: Mapped[str] = mapped_column(String(200), primary_key=True)
    opportunity_id: Mapped[str] = mapped_column(String(100), index=True)
    action: Mapped[str] = mapped_column(String(30))
    actor: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CareerRequest(Base):
    __tablename__ = "career_requests"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    student_id: Mapped[str] = mapped_column(String(80), index=True)
    request_type: Mapped[str] = mapped_column(String(30), index=True)
    data: Mapped[dict[str, Any]] = mapped_column(JSON)
    uploaded_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    uploaded_file_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class InternshipReport(Base):
    __tablename__ = "internship_reports"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    student_id: Mapped[str] = mapped_column(String(80), index=True)
    phase: Mapped[str] = mapped_column(String(10), index=True)
    status: Mapped[str] = mapped_column(String(30), default="Draft")
    note: Mapped[str] = mapped_column(Text, default="")
    reviewer_comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class InternshipReportFile(Base):
    __tablename__ = "internship_report_files"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    report_id: Mapped[str] = mapped_column(String(80), index=True)
    requirement_id: Mapped[str] = mapped_column(String(80))
    file_name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="Draft")
    reviewer_comment: Mapped[str] = mapped_column(Text, default="")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CommunityPost(Base):
    __tablename__ = "community_posts"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    author_id: Mapped[str] = mapped_column(String(80), index=True)
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    replies: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class CommunityMessage(Base):
    __tablename__ = "community_messages"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    sender_id: Mapped[str] = mapped_column(String(80), index=True)
    recipient_id: Mapped[str] = mapped_column(String(80), index=True)
    body: Mapped[str] = mapped_column(Text)
    read_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ProfilePayload(BaseModel):
    profile: dict[str, Any]


class EmployerProfilePayload(BaseModel):
    profile: dict[str, Any]


class OpportunityPayload(BaseModel):
    opportunity: dict[str, Any]


class OpportunityDecisionPayload(BaseModel):
    decision: str = Field(pattern="^(approve|reject)$")


class CareerjetDiscoveryPayload(BaseModel):
    programme_id: str = Field(min_length=1, max_length=100)
    location: str = Field(min_length=2, max_length=100)
    skills: list[str] = Field(default_factory=list, max_length=10)
    page: int = Field(default=1, ge=1, le=50)


class CareerjetImportPayload(BaseModel):
    programme_id: str = Field(min_length=1, max_length=100)
    job: dict[str, Any]


class CareerjetDecisionPayload(BaseModel):
    action: str = Field(pattern="^(approve|reject|archive)$")
    reason: str = Field(default="", max_length=1000)


class StudentApplicationPayload(BaseModel):
    note: str = Field(default="", max_length=2000)
    share_cv: bool = False


class ApplicationStatusPayload(BaseModel):
    status: str = Field(pattern="^(Under Review|Shortlisted|Interview|Rejected|Placed)$")


class EmployerDecisionPayload(BaseModel):
    decision: str = Field(pattern="^(approve|reject)$")


class ResponsePayload(BaseModel):
    response: str = Field(pattern="^(interested|passed)$")


class CareerRequestEmailPayload(BaseModel):
    action: str = Field(pattern="^(event_interest|mock_interview|cv_review)$")


class AuthPayload(BaseModel):
    email: str
    password: str = Field(min_length=8)
    name: str | None = None
    role: str | None = None
    staff_code: str | None = None
    programme_id: str | None = None


class CommunityPostPayload(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=5000)


class CommunityReplyPayload(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class CommunityMessagePayload(BaseModel):
    recipient_id: str
    body: str = Field(min_length=1, max_length=5000)


class InternshipReportReviewPayload(BaseModel):
    status: str = Field(pattern="^(Approved|Changes Requested)$")
    comment: str = Field(default="", max_length=5000)


class AssistantHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=2500)


class AssistantQuestionPayload(BaseModel):
    question: str = Field(min_length=2, max_length=1000)
    history: list[AssistantHistoryMessage] = Field(default_factory=list, max_length=8)


app = FastAPI(title="APU NEXT Career API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(","),
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Authorization", "Content-Type"],
)
bearer = HTTPBearer(auto_error=False)

KNOWLEDGE_PATH = BACKEND_DIR / "knowledge" / "apu_internship_documents.txt"


def b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def send_email(to_email: str, subject: str, body: str, reply_to: str | None = None, attachment_path: str | None = None) -> str:
    host, username, password = os.getenv("SMTP_HOST", "smtp.gmail.com"), os.getenv("SMTP_USERNAME", ""), os.getenv("SMTP_PASSWORD", "")
    sender = os.getenv("EMAIL_FROM", username)
    if not (host and username and password and sender):
        return "not_configured"
    message = EmailMessage()
    message["From"], message["To"], message["Subject"] = sender, to_email, subject
    if reply_to:
        message["Reply-To"] = reply_to
    message.set_content(body)
    if attachment_path and Path(attachment_path).is_file():
        import mimetypes
        content_type, _ = mimetypes.guess_type(attachment_path)
        major, minor = (content_type or "application/octet-stream").split("/", 1)
        message.add_attachment(Path(attachment_path).read_bytes(), maintype=major, subtype=minor, filename=Path(attachment_path).name)
    try:
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT", "587")), timeout=20) as server:
            server.starttls(context=ssl.create_default_context())
            server.login(username, password)
            server.send_message(message)
        return "sent"
    except Exception:
        return "failed"


def issue_token(account: Account) -> str:
    claims = {"sub": account.id, "exp": int((datetime.now(timezone.utc) + timedelta(days=7)).timestamp())}
    payload = b64(json.dumps(claims, separators=(",", ":")).encode())
    signature = b64(hmac.new(AUTH_SECRET.encode(), payload.encode(), hashlib.sha256).digest())
    return f"{payload}.{signature}"


def current_account(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> Account:
    if not credentials:
        raise HTTPException(401, "Sign in is required")
    try:
        payload, signature = credentials.credentials.split(".", 1)
        expected = b64(hmac.new(AUTH_SECRET.encode(), payload.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(signature, expected):
            raise ValueError("invalid signature")
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        if int(claims["exp"]) < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError("expired token")
    except Exception as error:
        raise HTTPException(401, "Session is invalid or has expired") from error
    with Session(engine) as db:
        account = db.get(Account, claims.get("sub"))
        if not account:
            raise HTTPException(401, "Account no longer exists")
        if account.role == "employer" and account.approval_status != "Approved":
            message = "Your company registration is awaiting Career Centre approval." if account.approval_status == "Pending" else "Your company registration was rejected by the Career Centre."
            raise HTTPException(403, message)
        db.expunge(account)
        return account


def require_role(*roles: str):
    def check(account: Account = Depends(current_account)) -> Account:
        if account.role not in roles:
            raise HTTPException(403, "Your account cannot perform this action")
        return account
    return check


def account_result(account: Account) -> dict[str, Any]:
    return {"token": issue_token(account), "user": {"id": account.id, "name": account.name, "email": account.email, "role": account.role, "subtitle": {"student": "Student", "admin": "Career Centre", "employer": "Employer"}[account.role], "initials": "".join(part[0] for part in account.name.split()[:2]).upper(), "verifiedEmail": False}, "approvalStatus": account.approval_status}


def match_score(profile: dict[str, Any], opp: dict[str, Any]) -> dict[str, Any] | None:
    if opp.get("approvalStatus") not in (None, "Approved") or profile.get("openToMatches") is False:
        return None
    try:
        if opp.get("deadline") and date.fromisoformat(str(opp["deadline"])[:10]) < date.today():
            return None
    except ValueError:
        pass

    aliases = {
        "javascript": ["javascript", "js", "ecmascript"], "react": ["react", "reactjs", "react.js"],
        "python": ["python", "py"], "node.js": ["node.js", "nodejs", "node js"],
        "sql": ["sql", "mysql", "postgresql", "postgres", "sqlite"],
        "power bi": ["power bi", "powerbi", "microsoft power bi"], "excel": ["excel", "ms excel", "microsoft excel", "spreadsheet"],
        "machine learning": ["machine learning", "ml", "scikit-learn", "scikit learn", "sklearn"],
        "data analysis": ["data analysis", "data analytics", "analytics", "data analyst"],
        "communication": ["communication", "presentation", "public speaking"],
        "ui ux": ["ui ux", "ui/ux", "user experience", "user interface"],
    }
    def norm(value: Any) -> str:
        text = re.sub(r"[^a-z0-9+#./\s-]", " ", str(value).lower())
        text = re.sub(r"[./-]+", " ", text)
        return re.sub(r"\s+", " ", text).strip()
    def canonical(value: Any) -> str:
        text = norm(value)
        for key, values in aliases.items():
            if text in [norm(alias) for alias in values]:
                return key
        return text

    student_text = " ".join([
        str(profile.get("bio", "")), *map(str, profile.get("skills", [])), *map(str, profile.get("careerInterests", [])),
        *[str(value) for project in profile.get("projects", []) for value in [project.get("title", ""), project.get("summary", ""), *project.get("techStack", [])]],
        *[str(value) for experience in profile.get("workExperience", []) for value in [experience.get("role", ""), experience.get("summary", ""), experience.get("organization", "")]],
    ])
    required = list(dict.fromkeys(canonical(skill) for skill in opp.get("skills", []) if norm(skill)))
    skill_text = norm(student_text)
    profile_skills = {canonical(skill) for skill in [*profile.get("skills", []), *profile.get("careerInterests", [])]}
    matched = [skill for skill in required if skill in profile_skills or norm(skill) in skill_text]
    missing = [skill for skill in required if skill not in matched]
    coverage = len(matched) / len(required) if required else 0
    skills_score = round(35 + 35 * coverage) if required and matched else (25 if not required else 0)

    targets = [norm(opp.get("degreeTarget", "")), *[norm(item) for item in opp.get("eligibleMajors", [])]]
    targets = [value for value in targets if value]
    program_text = norm(f"{profile.get('degree', '')} {profile.get('major', '')}")
    generic = any("all programme" in value or "all program" in value or "related discipline" in value or "any programme" in value for value in targets)
    program_match = not targets or generic or bool(program_text) and any(value in program_text or program_text in value or any(word in program_text for word in value.split() if len(word) > 3) for value in targets)
    program_score = 15 if program_match else 5

    places = [norm(value) for value in profile.get("preferredLocations", []) if norm(value)]
    job_place = norm(opp.get("location", ""))
    location_match = not places or not job_place or any(place in job_place or job_place in place for place in places)
    location_score = 10 if location_match else 4

    try:
        starts = [date.fromisoformat(str(value)[:10]) if value else None for value in [profile.get("internshipStartDate"), profile.get("internshipEndDate"), opp.get("internshipStartDate"), opp.get("internshipEndDate")]]
        dates_known = all(starts)
        date_match = bool(dates_known and starts[0] <= starts[3] and starts[1] >= starts[2])
    except (ValueError, TypeError):
        dates_known, date_match = False, False
    timing_score = 5 if date_match else (1 if dates_known else 3)
    score = min(100, skills_score + program_score + location_score + timing_score)
    return {"score": score, "components": {"skills": skills_score, "programme": program_score, "location": location_score, "timing": timing_score}, "matchedSkills": matched, "missingSkills": missing,
            "reasons": [f"{len(matched)}/{len(required)} listing keywords found" + (f": {', '.join(matched)}" if matched else "") + (f"; still to develop: {', '.join(missing)}" if missing else ""), "Your programme appears eligible" if program_match else "Programme eligibility may need Career Centre review", "Location fits your preferences or no preference was set" if location_match else "Location differs from your preferred locations", "Your placement dates overlap the listing" if date_match else "Add or review your placement dates"]}


def is_career_centre_listing(data: dict[str, Any]) -> bool:
    return str(data.get("sourceLabel", "")).startswith("Career Centre")


def notify_student_match(db: Session, student_id: str, opportunity: dict[str, Any], score: int) -> str:
    event_id = f"match-email:{student_id}:{opportunity.get('id')}"
    if db.get(ApprovalEvent, event_id):
        return "already_sent"
    account = db.get(Account, student_id)
    if not account:
        return "no_account"
    link = f"{os.getenv('APP_BASE_URL', 'http://localhost:3000')}/?page=opportunities&opportunity={opportunity.get('id')}"
    status = send_email(account.email, f"APU NEXT | Strong internship match: {opportunity.get('title', 'Opportunity')}", f"Hi {account.name},\n\nAn approved internship opportunity has a {score}% profile fit.\n\n{opportunity.get('title', 'Internship')} at {opportunity.get('company', 'the listed company')}\nOpen your APU NEXT matches: {link}\n\nReview the listing and apply directly through the company’s official page. This is a profile relevance suggestion, not a guarantee of selection.")
    if status == "sent":
        db.add(ApprovalEvent(id=event_id, opportunity_id=str(opportunity.get("id")), action="match_email_sent", actor=student_id))
    return status


def recompute(db: Session, student_id: str) -> None:
    student = db.get(Student, student_id)
    if not student:
        return
    existing = {row.opportunity_id: row for row in db.scalars(select(Match).where(Match.student_id == student_id)).all()}
    approved_ids: set[str] = set()
    for opp in db.scalars(select(OpportunityRecord).where(OpportunityRecord.status == "Approved")).all():
        approved_ids.add(opp.id)
        result = match_score(student.data, opp.data)
        row = existing.get(opp.id)
        if result and result["score"] >= 80:
            if row is None:
                row = Match(id=f"{student_id}:{opp.id}", student_id=student_id, opportunity_id=opp.id, response=None)
                db.add(row)
            row.score, row.components, row.reasons = result["score"], result["components"], result["reasons"]
        elif row:
            row.score, row.components, row.reasons = 0, {"skills": 0, "programme": 0, "location": 0, "timing": 0}, ["No longer meets current matching criteria"]
    for opportunity_id, row in existing.items():
        if opportunity_id not in approved_ids:
            row.score, row.components, row.reasons = 0, {"skills": 0, "programme": 0, "location": 0, "timing": 0}, ["Opportunity is no longer published"]


@app.on_event("startup")
def initialize_database() -> None:
    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(students)").fetchall()} if DATABASE_URL.startswith("sqlite") else set()
        if DATABASE_URL.startswith("sqlite"):
            if "cv_file_name" not in columns:
                connection.exec_driver_sql("ALTER TABLE students ADD COLUMN cv_file_name VARCHAR(255)")
            if "cv_file_path" not in columns:
                connection.exec_driver_sql("ALTER TABLE students ADD COLUMN cv_file_path TEXT")
        if DATABASE_URL.startswith("sqlite"):
            account_columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(accounts)").fetchall()}
            if "employer_profile" not in account_columns:
                connection.exec_driver_sql("ALTER TABLE accounts ADD COLUMN employer_profile JSON")
            if "approval_status" not in account_columns:
                connection.exec_driver_sql("ALTER TABLE accounts ADD COLUMN approval_status VARCHAR(20) DEFAULT 'Approved'")
            report_file_columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(internship_report_files)").fetchall()}
            if "status" not in report_file_columns:
                connection.exec_driver_sql("ALTER TABLE internship_report_files ADD COLUMN status VARCHAR(30) DEFAULT 'Draft'")
            if "reviewer_comment" not in report_file_columns:
                connection.exec_driver_sql("ALTER TABLE internship_report_files ADD COLUMN reviewer_comment TEXT DEFAULT ''")
    with Session(engine) as db:
        for student in db.scalars(select(Student)).all():
            if student.data.get("programmeId"):
                continue
            programme_id = infer_programme_id(str(student.data.get("degree") or ""), str(student.data.get("major") or ""))
            if programme_id:
                student.data = {**student.data, "programmeId": programme_id}
        db.commit()


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    with engine.connect() as connection:
        connection.exec_driver_sql("SELECT 1")
    return {"status": "ok", "database": "connected"}


@app.get("/api/v1/programmes")
def list_programmes() -> list[dict[str, Any]]:
    return [dict(programme) for programme in PROGRAMMES if programme["active"]]


@app.post("/api/v1/auth/register", status_code=201)
def register(payload: AuthPayload) -> dict[str, Any]:
    role = payload.role or "student"
    if role not in {"student", "employer", "admin"}:
        raise HTTPException(422, "Choose a valid account type")
    programme = get_programme(payload.programme_id)
    if role == "student" and not programme:
        raise HTTPException(422, "Choose a programme from the APU programme catalogue")
    if role != "student" and payload.programme_id:
        raise HTTPException(422, "Only student registration accepts an academic programme")
    if role == "admin":
        expected_code = os.getenv("CAREER_STAFF_INVITE_CODE", "")
        if not expected_code or not hmac.compare_digest(payload.staff_code or "", expected_code):
            raise HTTPException(403, "Career Centre staff registration requires the configured invite code")
    email = payload.email.strip().lower()
    if "@" not in email:
        raise HTTPException(422, "Enter a valid email address")
    with Session(engine) as db:
        if db.scalar(select(Account).where(Account.email == email)):
            raise HTTPException(409, "An account already exists for this email")
        salt = secrets.token_bytes(16)
        account = Account(id=str(uuid.uuid4()), name=(payload.name or "").strip(), email=email, role=role, approval_status="Pending" if role == "employer" else "Approved", password_salt=salt.hex(), password_hash=hashlib.pbkdf2_hmac("sha256", payload.password.encode(), salt, 310_000).hex())
        if not account.name:
            raise HTTPException(422, "Enter your name")
        db.add(account)
        if role == "student":
            profile = {"name": account.name, "studentId": account.id, "email": account.email, "degree": programme["name"], "programmeId": programme["id"], "major": "", "yearOfStudy": "", "graduationStatus": "", "cgpa": "", "bio": "", "skills": [], "careerInterests": [], "preferredIndustries": [], "preferredLocations": [], "internshipAvailability": "", "internshipStartDate": "", "internshipEndDate": "", "openToMatches": True, "cvFileName": None, "cvUpdatedDate": None, "projects": [], "certifications": [], "education": [], "workExperience": []}
            db.add(Student(id=account.id, data=profile))
        db.commit()
        db.refresh(account)
        if role == "employer":
            return {"token": "", "user": {"id": account.id, "name": account.name, "email": account.email, "role": account.role, "subtitle": "Employer", "initials": "".join(part[0] for part in account.name.split()[:2]).upper(), "verifiedEmail": False}, "approvalStatus": "Pending", "message": "Company registration submitted. Career Centre approval is required before sign in."}
        return account_result(account)


@app.post("/api/v1/auth/login")
def login(payload: AuthPayload) -> dict[str, Any]:
    email = payload.email.strip().lower()
    with Session(engine) as db:
        account = db.scalar(select(Account).where(Account.email == email))
        if not account:
            raise HTTPException(401, "Email or password is incorrect")
        salt = bytes.fromhex(account.password_salt)
        supplied = hashlib.pbkdf2_hmac("sha256", payload.password.encode(), salt, 310_000).hex()
        if not hmac.compare_digest(supplied, account.password_hash):
            raise HTTPException(401, "Email or password is incorrect")
        if account.role == "employer" and account.approval_status != "Approved":
            message = "Your company registration is awaiting Career Centre approval." if account.approval_status == "Pending" else "Your company registration was rejected by the Career Centre."
            raise HTTPException(403, message)
        return account_result(account)


@app.get("/api/v1/employer/profile")
def get_employer_profile(account: Account = Depends(require_role("employer"))) -> dict[str, Any]:
    profile = account.employer_profile or {
        "companyName": account.name,
        "employerCount": 1,
        "location": "Kuala Lumpur",
        "website": "",
        "description": "",
    }
    return {**profile, "approvalStatus": account.approval_status, "createdAt": account.created_at.isoformat()}


@app.get("/api/v1/admin/employers/pending")
def list_pending_employers(account: Account = Depends(require_role("admin"))) -> list[dict[str, Any]]:
    with Session(engine) as db:
        employers = db.scalars(select(Account).where(Account.role == "employer", Account.approval_status == "Pending").order_by(Account.created_at)).all()
        return [{"id": item.id, "companyName": item.name, "email": item.email, "profile": item.employer_profile or {}, "createdAt": item.created_at.isoformat()} for item in employers]


@app.get("/api/v1/admin/employers")
def list_employers(account: Account = Depends(require_role("admin"))) -> list[dict[str, Any]]:
    with Session(engine) as db:
        employers = db.scalars(select(Account).where(Account.role == "employer").order_by(Account.created_at.desc())).all()
        opportunities = db.scalars(select(OpportunityRecord)).all()
        return [
            {
                "id": item.id,
                "companyName": item.name,
                "email": item.email,
                "profile": item.employer_profile or {},
                "approvalStatus": item.approval_status,
                "createdAt": item.created_at.isoformat(),
                "listings": [
                    opportunity.data
                    for opportunity in opportunities
                    if opportunity.data.get("sourceLabel") == f"Employer listing · {item.id}"
                ],
            }
            for item in employers
        ]


@app.get("/api/v1/admin/employers/{employer_id}")
def get_admin_employer_detail(employer_id: str, account: Account = Depends(require_role("admin"))) -> dict[str, Any]:
    with Session(engine) as db:
        employer = db.get(Account, employer_id)
        if not employer or employer.role != "employer":
            raise HTTPException(404, "Company not found")
        listings = [
            {"opportunity": item.data, "status": item.status, "submittedAt": item.created_at.isoformat()}
            for item in db.scalars(select(OpportunityRecord)).all()
            if item.data.get("sourceLabel") == f"Employer listing · {employer.id}"
        ]
        return {
            "id": employer.id,
            "companyName": employer.name,
            "email": employer.email,
            "profile": employer.employer_profile or {},
            "approvalStatus": employer.approval_status,
            "createdAt": employer.created_at.isoformat(),
            "approvalReviewedAt": None,
            "reviewNotes": None,
            "listings": listings,
        }


@app.put("/api/v1/admin/employers/{employer_id}/decision")
def decide_employer(employer_id: str, payload: EmployerDecisionPayload, account: Account = Depends(require_role("admin"))) -> dict[str, str]:
    with Session(engine) as db:
        employer = db.get(Account, employer_id)
        if not employer or employer.role != "employer":
            raise HTTPException(404, "Employer account not found")
        employer.approval_status = "Approved" if payload.decision == "approve" else "Rejected"
        db.commit()
        return {"id": employer.id, "approvalStatus": employer.approval_status}


@app.put("/api/v1/employer/profile")
def update_employer_profile(payload: EmployerProfilePayload, account: Account = Depends(require_role("employer"))) -> dict[str, Any]:
    profile = {
        "companyName": str(payload.profile.get("companyName", "")).strip(),
        "employerCount": max(1, int(payload.profile.get("employerCount", 1))),
        "location": str(payload.profile.get("location", "Kuala Lumpur")).strip() or "Kuala Lumpur",
        "website": str(payload.profile.get("website", "")).strip(),
        "description": str(payload.profile.get("description", "")).strip(),
    }
    if not profile["companyName"]:
        raise HTTPException(422, "Enter a company name")
    with Session(engine) as db:
        saved = db.get(Account, account.id)
        if not saved:
            raise HTTPException(404, "Employer account not found")
        previous_name = saved.name
        saved.name = profile["companyName"]
        saved.employer_profile = profile
        if previous_name != saved.name:
            listings = db.scalars(select(OpportunityRecord)).all()
            for listing in listings:
                if listing.data.get("sourceLabel") == f"Employer listing · {saved.id}":
                    listing.data = {**listing.data, "company": saved.name}
        db.commit()
        result = {**profile, "approvalStatus": saved.approval_status, "createdAt": saved.created_at.isoformat()}
    return result


@app.get("/api/v1/community/users")
def community_users(account: Account = Depends(current_account)) -> list[dict[str, str]]:
    if account.role not in ("student", "admin"):
        raise HTTPException(403, "Messaging is available to students and Career Centre staff only")
    with Session(engine) as db:
        query = select(Account).where(Account.id != account.id, Account.role.in_(("student", "admin")))
        rows = db.scalars(query.order_by(Account.name)).all()
        return [{"id": row.id, "name": row.name, "role": "Career Centre staff" if row.role == "admin" else row.role.title(), "email": row.email} for row in rows]


@app.get("/api/v1/community/messages/unread")
def unread_community_messages(account: Account = Depends(current_account)) -> dict[str, int]:
    if account.role not in ("student", "admin"):
        return {"count": 0}
    with Session(engine) as db:
        count = db.scalar(
            select(func.count(CommunityMessage.id))
            .join(Account, CommunityMessage.sender_id == Account.id)
            .where(
                CommunityMessage.recipient_id == account.id,
                CommunityMessage.read_at.is_(None),
                Account.role.in_(("student", "admin")),
            )
        ) or 0
        return {"count": int(count)}


@app.get("/api/v1/community/messages/{other_id}")
def community_messages(other_id: str, account: Account = Depends(current_account)) -> list[dict[str, Any]]:
    if account.role not in ("student", "admin"):
        raise HTTPException(403, "Messaging is available to students and Career Centre staff only")
    with Session(engine) as db:
        other = db.get(Account, other_id)
        if not other or other.id == account.id:
            raise HTTPException(404, "Conversation participant not found")
        if other.role not in ("student", "admin"):
            raise HTTPException(403, "You can message students and Career Centre staff only")
        rows = db.scalars(select(CommunityMessage).where(
            ((CommunityMessage.sender_id == account.id) & (CommunityMessage.recipient_id == other_id))
            | ((CommunityMessage.sender_id == other_id) & (CommunityMessage.recipient_id == account.id))
        ).order_by(CommunityMessage.created_at)).all()
        for row in rows:
            if row.recipient_id == account.id and row.read_at is None:
                row.read_at = datetime.utcnow()
        db.commit()
        return [{"id": row.id, "senderId": row.sender_id, "recipientId": row.recipient_id, "body": row.body, "createdAt": row.created_at.isoformat(), "read": row.read_at is not None} for row in rows]


@app.post("/api/v1/community/messages", status_code=201)
def send_community_message(payload: CommunityMessagePayload, account: Account = Depends(current_account)) -> dict[str, Any]:
    if account.role not in ("student", "admin"):
        raise HTTPException(403, "Messaging is available to students and Career Centre staff only")
    with Session(engine) as db:
        recipient = db.get(Account, payload.recipient_id)
        if not recipient or recipient.id == account.id:
            raise HTTPException(404, "Recipient not found")
        if recipient.role not in ("student", "admin"):
            raise HTTPException(403, "You can message students and Career Centre staff only")
        message = CommunityMessage(id=str(uuid.uuid4()), sender_id=account.id, recipient_id=recipient.id, body=payload.body.strip())
        db.add(message)
        db.commit()
        db.refresh(message)
        return {"id": message.id, "senderId": message.sender_id, "recipientId": message.recipient_id, "body": message.body, "createdAt": message.created_at.isoformat(), "read": False}


def post_result(post: CommunityPost, author: Account) -> dict[str, Any]:
    return {
        "id": post.id,
        "author": author.name,
        "authorId": author.id,
        "role": "Career Centre staff" if author.role == "admin" else author.role.title(),
        "title": post.title,
        "body": post.body,
        "createdAt": post.created_at.isoformat(),
        "likes": post.likes,
        "replies": post.replies or [],
    }


@app.get("/api/v1/community/posts")
def community_posts(account: Account = Depends(current_account)) -> list[dict[str, Any]]:
    with Session(engine) as db:
        posts = db.scalars(select(CommunityPost).order_by(CommunityPost.created_at.desc())).all()
        authors = {author.id: author for author in db.scalars(select(Account)).all()}
        return [post_result(post, authors[post.author_id]) for post in posts if post.author_id in authors]


@app.post("/api/v1/community/posts", status_code=201)
def create_community_post(payload: CommunityPostPayload, account: Account = Depends(current_account)) -> dict[str, Any]:
    with Session(engine) as db:
        post = CommunityPost(id=str(uuid.uuid4()), author_id=account.id, title=payload.title.strip(), body=payload.body.strip(), likes=0, replies=[])
        db.add(post)
        db.commit()
        db.refresh(post)
        return post_result(post, account)


@app.post("/api/v1/community/posts/{post_id}/like")
def like_community_post(post_id: str, account: Account = Depends(current_account)) -> dict[str, int]:
    with Session(engine) as db:
        post = db.get(CommunityPost, post_id)
        if not post:
            raise HTTPException(404, "Post not found")
        post.likes += 1
        db.commit()
        return {"likes": post.likes}


@app.post("/api/v1/community/posts/{post_id}/replies")
def reply_to_community_post(post_id: str, payload: CommunityReplyPayload, account: Account = Depends(current_account)) -> dict[str, Any]:
    with Session(engine) as db:
        post = db.get(CommunityPost, post_id)
        if not post:
            raise HTTPException(404, "Post not found")
        replies = list(post.replies or [])
        replies.append({"id": str(uuid.uuid4()), "author": account.name, "role": "Career Centre staff" if account.role == "admin" else account.role.title(), "body": payload.body.strip(), "createdAt": datetime.utcnow().isoformat()})
        post.replies = replies
        db.commit()
        return {"replies": replies}


def _assistant_response(
    payload: AssistantQuestionPayload,
    attachment_text: str | None = None,
    attachment_name: str | None = None,
) -> dict[str, Any]:
    history = [item.model_dump() for item in payload.history]
    query = assistant_service.retrieval_question(payload.question, history)
    if attachment_text:
        query = f"{query}\n{attachment_name or ''}\n{attachment_text[:2000]}"
    try:
        contexts = (
            assistant_service.retrieve_context(query)
            if assistant_service.should_retrieve_context(payload.question, attachment_text)
            else []
        )
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as error:
        raise HTTPException(503, "I’m unable to access internship guidance right now. Please try again shortly.") from error
    try:
        answer, mode = assistant_service.answer_question(
            payload.question,
            contexts,
            history,
            attachment_text,
            attachment_name,
        )
    except RuntimeError as error:
        raise HTTPException(503, "I couldn’t prepare an answer just now. Please try again.") from error

    sources = []
    seen_sources: set[tuple[str, str]] = set()
    for item in assistant_service.sources_for_answer(payload.question, contexts, mode):
        reference = (item["source"], item["location"])
        if reference in seen_sources:
            continue
        seen_sources.add(reference)
        sources.append({
            "title": item["title"],
            "document": Path(item["source"]).name,
            "location": item["location"],
            "version": None,
        })
    return {"answer": answer, "sources": sources, "mode": mode}


@app.post("/api/v1/assistant/ask")
def ask_internship_assistant(payload: AssistantQuestionPayload, account: Account = Depends(current_account)) -> dict[str, Any]:
    if account.role != "student":
        raise HTTPException(403, "APU NEXT is available to student accounts only")
    return _assistant_response(payload)


def _extract_assistant_attachment(upload: UploadFile) -> tuple[str, str]:
    from io import BytesIO
    from zipfile import BadZipFile

    from docx.opc.exceptions import PackageNotFoundError
    from docx.oxml.exceptions import InvalidXmlError
    from lxml.etree import XMLSyntaxError
    from pypdf.errors import PyPdfError

    file_name = Path(upload.filename or "attachment").name
    extension = Path(file_name).suffix.lower()
    if extension not in {".pdf", ".docx", ".txt"}:
        raise HTTPException(415, "Attach a text-based PDF, DOCX, or TXT file. Legacy DOC and image files are not supported here.")

    raw = upload.file.read(5 * 1024 * 1024 + 1)
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(413, "Attachments must be 5 MB or smaller.")
    if not raw:
        raise HTTPException(422, "The attached file is empty.")

    try:
        if extension == ".pdf":
            from pypdf import PdfReader

            reader = PdfReader(BytesIO(raw))
            text = "\n".join(page.extract_text() or "" for page in reader.pages[:40])
        elif extension == ".docx":
            from docx import Document

            document = Document(BytesIO(raw))
            parts = [paragraph.text for paragraph in document.paragraphs]
            for table in document.tables:
                parts.extend(" | ".join(cell.text for cell in row.cells) for row in table.rows)
            text = "\n".join(parts)
        else:
            text = raw.decode("utf-8-sig", errors="replace")
    except (
        BadZipFile,
        InvalidXmlError,
        KeyError,
        OSError,
        PackageNotFoundError,
        PyPdfError,
        ValueError,
        XMLSyntaxError,
    ) as error:
        raise HTTPException(422, "The attachment could not be read. Try a text-based PDF, DOCX, or UTF-8 TXT file.") from error

    text = re.sub(r"\x00", " ", text).strip()
    if not text:
        raise HTTPException(422, "No readable text was found. Scanned PDFs and image-only documents are not supported.")
    return file_name, text[:16000]


@app.post("/api/v1/assistant/ask-with-file")
def ask_with_attachment(
    question: str = Form(default="Please review this file.", min_length=2, max_length=1000),
    history: str = Form(default="[]", max_length=24000),
    file: UploadFile = File(...),
    account: Account = Depends(current_account),
) -> dict[str, Any]:
    if account.role != "student":
        raise HTTPException(403, "APU NEXT is available to student accounts only")
    try:
        history_items = json.loads(history)
        payload = AssistantQuestionPayload.model_validate({"question": question, "history": history_items})
    except (json.JSONDecodeError, ValidationError) as error:
        raise HTTPException(422, "The conversation history is invalid. Please reset the conversation and retry.") from error
    attachment_name, attachment_text = _extract_assistant_attachment(file)
    return _assistant_response(payload, attachment_text, attachment_name)


def internship_report_result(db: Session, report: InternshipReport, student: Account | None = None) -> dict[str, Any]:
    files = db.scalars(select(InternshipReportFile).where(InternshipReportFile.report_id == report.id).order_by(InternshipReportFile.uploaded_at)).all()
    return {
        "id": report.id,
        "studentId": report.student_id,
        "studentName": student.name if student else None,
        "studentEmail": student.email if student else None,
        "phase": report.phase,
        "status": report.status,
        "note": report.note,
        "reviewerComment": report.reviewer_comment,
        "createdAt": report.created_at.isoformat(),
        "updatedAt": report.updated_at.isoformat(),
        "submittedAt": report.submitted_at.isoformat() if report.submitted_at else None,
        "reviewedAt": report.reviewed_at.isoformat() if report.reviewed_at else None,
        "files": [{"id": item.id, "requirementId": item.requirement_id, "fileName": item.file_name, "uploadedAt": item.uploaded_at.isoformat(), "status": item.status, "reviewerComment": item.reviewer_comment} for item in files],
    }


@app.get("/api/v1/internship-reports")
def get_internship_reports(account: Account = Depends(current_account)) -> list[dict[str, Any]]:
    if account.role != "student":
        raise HTTPException(403, "Only students can view their internship reports")
    with Session(engine) as db:
        return [internship_report_result(db, report) for report in db.scalars(select(InternshipReport).where(InternshipReport.student_id == account.id).order_by(InternshipReport.phase)).all()]


@app.post("/api/v1/internship-reports/files", status_code=201)
async def upload_internship_report_file(
    phase: str = Form(...),
    requirement_id: str = Form(...),
    file: UploadFile = File(...),
    account: Account = Depends(current_account),
) -> dict[str, Any]:
    if account.role != "student":
        raise HTTPException(403, "Only students can upload internship reports")
    if phase not in {"part1", "part2"}:
        raise HTTPException(422, "Choose Part 1 or Part 2")
    if file.size and file.size > 15_000_000:
        raise HTTPException(413, "Each internship file must be 15 MB or smaller")
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".pdf", ".doc", ".docx", ".xlsx", ".xls", ".png", ".jpg", ".jpeg"}:
        raise HTTPException(415, "Unsupported internship document format")
    with Session(engine) as db:
        report = db.scalar(select(InternshipReport).where(InternshipReport.student_id == account.id, InternshipReport.phase == phase))
        if not report:
            report = InternshipReport(id=str(uuid.uuid4()), student_id=account.id, phase=phase)
            db.add(report)
            db.flush()
        existing = db.scalar(select(InternshipReportFile).where(InternshipReportFile.report_id == report.id, InternshipReportFile.requirement_id == requirement_id))
        content = await file.read()
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        stored_path = UPLOAD_DIR / f"internship-{report.id}-{requirement_id}-{uuid.uuid4().hex}{suffix}"
        stored_path.write_bytes(content)
        if existing:
            Path(existing.file_path).unlink(missing_ok=True)
            existing.file_name, existing.file_path, existing.uploaded_at = file.filename or stored_path.name, str(stored_path), datetime.utcnow()
        else:
            db.add(InternshipReportFile(id=str(uuid.uuid4()), report_id=report.id, requirement_id=requirement_id, file_name=file.filename or stored_path.name, file_path=str(stored_path)))
        report.status = "Draft"
        report.reviewer_comment = ""
        db.commit()
        db.refresh(report)
        return internship_report_result(db, report)


@app.put("/api/v1/internship-reports/{report_id}/files/{file_id}/submit")
def submit_internship_report_file(report_id: str, file_id: str, note: str = Form(default=""), account: Account = Depends(current_account)) -> dict[str, Any]:
    if account.role != "student":
        raise HTTPException(403, "Only students can submit internship documents")
    with Session(engine) as db:
        report = db.get(InternshipReport, report_id)
        item = db.get(InternshipReportFile, file_id)
        if not report or report.student_id != account.id or not item or item.report_id != report_id:
            raise HTTPException(404, "Internship document not found")
        item.status = "Submitted"
        item.reviewer_comment = note.strip()
        report.status = "Submitted"
        report.submitted_at = datetime.utcnow()
        db.commit()
        db.refresh(report)
        return internship_report_result(db, report)


@app.put("/api/v1/internship-reports/{report_id}/submit")
def submit_internship_report(report_id: str, note: str = Form(default=""), account: Account = Depends(current_account)) -> dict[str, Any]:
    if account.role != "student":
        raise HTTPException(403, "Only students can submit internship reports")
    with Session(engine) as db:
        report = db.get(InternshipReport, report_id)
        if not report or report.student_id != account.id:
            raise HTTPException(404, "Internship report not found")
        if not db.scalar(select(InternshipReportFile).where(InternshipReportFile.report_id == report.id)):
            raise HTTPException(422, "Upload at least one required document before submitting")
        report.note = note.strip()
        report.status = "Submitted"
        report.submitted_at = datetime.utcnow()
        report.reviewer_comment = ""
        db.commit()
        db.refresh(report)
        return internship_report_result(db, report)


@app.get("/api/v1/admin/internship-reports")
def admin_internship_reports(account: Account = Depends(require_role("admin"))) -> list[dict[str, Any]]:
    with Session(engine) as db:
        reports = db.scalars(select(InternshipReport).order_by(InternshipReport.updated_at.desc())).all()
        students = {item.id: item for item in db.scalars(select(Account)).all()}
        return [internship_report_result(db, report, students.get(report.student_id)) for report in reports]


@app.put("/api/v1/admin/internship-reports/{report_id}/review")
def review_internship_report(report_id: str, payload: InternshipReportReviewPayload, account: Account = Depends(require_role("admin"))) -> dict[str, Any]:
    with Session(engine) as db:
        report = db.get(InternshipReport, report_id)
        if not report:
            raise HTTPException(404, "Internship report not found")
        report.status = payload.status
        report.reviewer_comment = payload.comment.strip()
        report.reviewed_at = datetime.utcnow()
        db.commit()
        db.refresh(report)
        return internship_report_result(db, report, db.get(Account, report.student_id))


@app.put("/api/v1/admin/internship-reports/{report_id}/files/{file_id}/review")
def review_internship_report_file(report_id: str, file_id: str, payload: InternshipReportReviewPayload, account: Account = Depends(require_role("admin"))) -> dict[str, Any]:
    with Session(engine) as db:
        report = db.get(InternshipReport, report_id)
        item = db.get(InternshipReportFile, file_id)
        if not report or not item or item.report_id != report_id:
            raise HTTPException(404, "Internship document not found")
        item.status = payload.status
        item.reviewer_comment = payload.comment.strip()
        item.uploaded_at = item.uploaded_at
        report.reviewed_at = datetime.utcnow()
        db.commit()
        db.refresh(report)
        return internship_report_result(db, report, db.get(Account, report.student_id))


@app.get("/api/v1/internship-reports/{report_id}/files/{file_id}")
def download_internship_report_file(report_id: str, file_id: str, account: Account = Depends(current_account)) -> FileResponse:
    with Session(engine) as db:
        report = db.get(InternshipReport, report_id)
        item = db.get(InternshipReportFile, file_id)
        if not report or not item or item.report_id != report_id:
            raise HTTPException(404, "Internship document not found")
        if account.role != "admin" and (account.role != "student" or report.student_id != account.id):
            raise HTTPException(403, "You cannot access this internship document")
        path = Path(item.file_path)
        if not path.is_file():
            raise HTTPException(404, "Stored internship document not found")
        return FileResponse(path, filename=item.file_name)


@app.get("/api/v1/students/{student_id}/profile")
def get_profile(student_id: str, account: Account = Depends(current_account)) -> dict[str, Any]:
    if account.role != "admin" and (account.role != "student" or account.id != student_id):
        raise HTTPException(403, "You can only view your own student profile")
    with Session(engine) as db:
        item = db.get(Student, student_id)
        if not item:
            raise HTTPException(404, "Student profile not found")
        data = dict(item.data)
        data["programmeId"] = data.get("programmeId") or infer_programme_id(str(data.get("degree") or ""), str(data.get("major") or "")) or ""
        return data


@app.get("/api/v1/admin/students/{student_id}")
def get_admin_student_detail(student_id: str, account: Account = Depends(require_role("admin"))) -> dict[str, Any]:
    with Session(engine) as db:
        student_account = db.get(Account, student_id)
        student = db.get(Student, student_id)
        if not student_account or student_account.role != "student" or not student:
            raise HTTPException(404, "Student profile not found")
        applications = db.scalars(select(StudentApplication).where(StudentApplication.student_id == student_id).order_by(StudentApplication.applied_at.desc())).all()
        reports = db.scalars(select(InternshipReport).where(InternshipReport.student_id == student_id).order_by(InternshipReport.updated_at.desc())).all()
        return {
            "account": {
                "id": student_account.id,
                "name": student_account.name,
                "email": student_account.email,
                "createdAt": student_account.created_at.isoformat(),
                "status": "Active",
            },
            "profile": {
                **student.data,
                "programmeId": student.data.get("programmeId") or infer_programme_id(str(student.data.get("degree") or ""), str(student.data.get("major") or "")) or "",
            },
            "resume": {
                "fileName": student.cv_file_name,
                "uploadedAt": student.data.get("cvUpdatedDate"),
                "available": bool(student.cv_file_path and Path(student.cv_file_path).is_file()),
            },
            "applications": [
                {
                    "id": application.id,
                    "opportunityId": application.opportunity_id,
                    "title": (opportunity.data.get("title") if (opportunity := db.get(OpportunityRecord, application.opportunity_id)) else "Vacancy no longer available"),
                    "company": opportunity.data.get("company", "") if opportunity else "",
                    "status": application.status,
                    "appliedAt": application.applied_at.isoformat(),
                    "resumeShared": application.cv_share_consent,
                }
                for application in applications
            ],
            "reports": [internship_report_result(db, report, student_account) for report in reports],
        }


@app.put("/api/v1/students/{student_id}/profile")
def save_profile(student_id: str, payload: ProfilePayload, account: Account = Depends(current_account)) -> dict[str, Any]:
    if account.role != "admin" and (account.role != "student" or account.id != student_id):
        raise HTTPException(403, "You can only update your own student profile")
    with Session(engine) as db:
        item = db.get(Student, student_id)
        data = dict(payload.profile)
        programme_id = str(data.get("programmeId") or "").strip()
        if programme_id:
            programme = get_programme(programme_id)
            if not programme:
                raise HTTPException(422, "Choose a programme from the APU catalogue")
            data["degree"] = programme["name"]
            data["programmeId"] = programme_id
        if account.role == "student":
            data.update({"studentId": account.id, "name": account.name, "email": account.email})
        if item:
            previous_cv_path = item.cv_file_path
            item.data = data
        else:
            previous_cv_path = None
            item = Student(id=student_id, data=data)
            db.add(item)
        if data.get("cvFileName") is None:
            item.cv_file_name = None
            item.cv_file_path = None
        db.flush()
        recompute(db, student_id)
        for match in db.scalars(select(Match).where(Match.student_id == student_id, Match.score >= 80)).all():
            opportunity = db.get(OpportunityRecord, match.opportunity_id)
            if opportunity and opportunity.status == "Approved":
                notify_student_match(db, student_id, opportunity.data, match.score)
        db.commit()
        if previous_cv_path and data.get("cvFileName") is None:
            Path(previous_cv_path).unlink(missing_ok=True)
        return {"profile": item.data, "matchesUpdated": True}


@app.post("/api/v1/students/{student_id}/cv/parse")
async def parse_cv(student_id: str, file: UploadFile = File(...), account: Account = Depends(current_account)) -> dict[str, Any]:
    if account.role != "student" or account.id != student_id:
        raise HTTPException(403, "CV parsing is available to the signed-in student")
    if file.size and file.size > 5_000_000:
        raise HTTPException(413, "CV must be 5 MB or smaller")
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".pdf", ".docx"}:
        raise HTTPException(415, "Upload a text-based PDF or DOCX")
    raw = await file.read()
    try:
        if file.filename and file.filename.lower().endswith(".pdf"):
            from pypdf import PdfReader
            import io
            text = "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(raw)).pages)
        elif file.filename and file.filename.lower().endswith(".docx"):
            from docx import Document
            import io
            text = "\n".join(paragraph.text for paragraph in Document(io.BytesIO(raw)).paragraphs)
        else:
            raise HTTPException(415, "Upload a text-based PDF or DOCX")
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(400, "Could not read this CV") from error
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_path = UPLOAD_DIR / f"{uuid.uuid4().hex}{suffix}"
    stored_path.write_bytes(raw)
    old_path: str | None = None
    with Session(engine) as db:
        student = db.get(Student, student_id)
        if student:
            old_path = student.cv_file_path
            student.cv_file_name = file.filename
            student.cv_file_path = str(stored_path)
            db.commit()
    if old_path:
        Path(old_path).unlink(missing_ok=True)
    parsed = parse_resume_profile(text, student_id, account.name, account.email)
    return {"fileName": file.filename, "proposedProfile": parsed, "requiresStudentConfirmation": True, "notes": ["Text-based extraction can miss or misclassify resume details. Review every field before saving."]}


@app.get("/api/v1/students/{student_id}/cv")
def download_cv(student_id: str, account: Account = Depends(current_account)) -> FileResponse:
    if account.role != "admin" and (account.role != "student" or account.id != student_id):
        raise HTTPException(403, "You can only access your own CV")
    with Session(engine) as db:
        student = db.get(Student, student_id)
        if not student or not student.cv_file_path or not Path(student.cv_file_path).is_file():
            raise HTTPException(404, "Stored CV not found")
        path = Path(student.cv_file_path)
        return FileResponse(path, filename=student.cv_file_name or path.name)


def parse_resume_profile(text: str, student_id: str, account_name: str, account_email: str) -> dict[str, Any]:
    """Extract reviewable resume fields using section cues and conservative patterns."""
    lines = [re.sub(r"^[\s•*▪◦–—-]+", "", line).strip() for line in text.splitlines()]
    lines = [line for line in lines if line]
    normalized_text = "\n".join(lines)
    heading_aliases = {
        "summary": {"summary", "profile", "professional summary", "personal profile", "objective", "career objective", "about me"},
        "education": {"education", "academic background", "qualifications", "academic qualifications"},
        "experience": {"experience", "work experience", "employment history", "professional experience", "internships", "work history"},
        "projects": {"projects", "selected projects", "academic projects", "personal projects", "portfolio"},
        "certifications": {"certifications", "certificates", "licenses and certifications", "professional certifications"},
        "skills": {"skills", "technical skills", "core competencies", "skills and competencies", "tools and technologies"},
    }
    heading_lookup = {re.sub(r"[^a-z ]", "", alias.lower()).strip(): key for key, aliases in heading_aliases.items() for alias in aliases}
    sections: dict[str, list[str]] = {key: [] for key in heading_aliases}
    current = "intro"
    intro: list[str] = []
    for line in lines:
        candidate = re.sub(r"[^a-z ]", "", line.lower()).strip()
        candidate = re.sub(r"\s+", " ", candidate)
        if candidate in heading_lookup:
            current = heading_lookup[candidate]
            continue
        if current == "intro":
            intro.append(line)
        elif current in sections:
            sections[current].append(line)

    def blocks(items: list[str]) -> list[list[str]]:
        # pypdf often preserves blank lines as line breaks only; group using common
        # record starts as a fallback while preserving all source wording.
        result: list[list[str]] = []
        group: list[str] = []
        for line in items:
            date_line = bool(re.search(r"\b(?:19|20)\d{2}\b", line))
            record_start = bool(re.match(r"^(?:intern|junior|senior|assistant|associate|software|data|business|marketing|research|project|volunteer|student|graduate|[A-Z][a-z]+\s+(?:engineer|analyst|manager|developer|intern|assistant))", line, re.I))
            if group and (date_line and any(re.search(r"\b(?:19|20)\d{2}\b", old) for old in group) or record_start and len(group) >= 3):
                result.append(group)
                group = []
            group.append(line)
        if group:
            result.append(group)
        return result

    name = account_name
    for line in intro[:10]:
        if "@" not in line and not re.search(r"https?://|\+?\d[\d\s()-]{7,}", line) and len(line.split()) in (2, 3, 4) and not re.search(r"\b(resume|curriculum vitae|cv)\b", line, re.I):
            name = line
            break
    email_match = re.search(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", normalized_text, re.I)
    profile_email = email_match.group(0) if email_match else account_email

    place_names = ["Kuala Lumpur", "Petaling Jaya", "Cyberjaya", "Selangor", "Putrajaya", "Subang Jaya", "Johor Bahru", "Penang", "George Town", "Shah Alam", "Malaysia"]
    explicit_location = re.search(r"(?:location|address|based in|current city)\s*[:\-]\s*([^\n|]+)", normalized_text, re.I)
    location = explicit_location.group(1).strip() if explicit_location else next((place for place in place_names if re.search(rf"\b{re.escape(place)}\b", normalized_text, re.I)), "")

    programme_catalog = [
        ("Software Engineering", ["software engineering", "software engineer"]),
        ("Computer Science (Data Analytics)", ["data analytics", "data analytic", "data science"]),
        ("Computer Science", ["computer science", "computing"]),
        ("Cyber Security", ["cyber security", "cybersecurity", "information security"]),
        ("Information Technology", ["information technology", "information systems"]),
        ("Business Administration", ["business administration", "business management"]),
        ("International Business Management", ["international business management", "international business"]),
        ("Accounting and Finance", ["accounting and finance", "accounting", "finance"]),
        ("Psychology", ["psychology", "psychological"]),
        ("Engineering", ["engineering", "electrical engineering", "mechanical engineering", "robotics"]),
        ("Industrial Design", ["industrial design", "product design"]),
        ("Animation", ["animation", "visual effects", "vfx"]),
        ("Marketing", ["marketing", "digital marketing"]),
    ]
    major = next((label for label, aliases in programme_catalog if any(alias in normalized_text.lower() for alias in aliases)), "")
    degree_match = re.search(r"\b(?:Bachelor(?:'s)?|BSc|B\.Sc\.?|BA|B\.A\.?|BEng|B\.Eng\.?|BBA|B\.B\.A\.?|Master(?:'s)?|MSc|M\.Sc\.?|MBA|PhD|Diploma)\b[^\n]{0,120}", normalized_text, re.I)
    degree = degree_match.group(0).strip(" ,|-") if degree_match else ""

    education_rows: list[dict[str, str]] = []
    education_text = sections["education"]
    edu_groups = blocks(education_text) if education_text else []
    if not edu_groups and degree:
        edu_groups = [[degree] + [line for line in lines if re.search(r"\b(?:university|college|institute|APU)\b", line, re.I)][:1]]
    for index, group in enumerate(edu_groups):
        block_text = " · ".join(group)
        qualification = next((line for line in group if re.search(r"bachelor|master|diploma|phd|bsc|b\.sc|beng|bba|mba|degree", line, re.I)), group[0] if group else "")
        institution = next((line for line in group if re.search(r"university|college|institute|APU", line, re.I) and line != qualification), "")
        date_match = re.search(r"((?:19|20)\d{2})\s*(?:-|–|to|—)\s*((?:19|20)\d{2}|Present|Current)", block_text, re.I)
        period = f"{date_match.group(1)}–{date_match.group(2)}" if date_match else ""
        grade_match = re.search(r"(?:CGPA|GPA|grade)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?(?:\s*/\s*[0-9]+(?:\.[0-9]+)?)?)", block_text, re.I)
        education_rows.append({"id": f"edu-cv-{index+1}", "institution": institution, "qualification": qualification, "period": period, "grade": grade_match.group(1) if grade_match else ""})

    current_year = date.today().year
    year_of_study = ""
    start_year_match = re.search(r"(?:19|20)\d{2}\s*(?:-|–|to|—)\s*(?:19|20)\d{2}", " ".join(education_text), re.I)
    graduation_years = [int(year) for year in re.findall(r"\b(?:19|20)\d{2}\b", " ".join(education_text))]
    if start_year_match:
        start_year = int(re.search(r"(?:19|20)\d{2}", start_year_match.group(0)).group(0))
        year_of_study = f"Year {max(1, min(3, current_year - start_year + 1))}"
    elif graduation_years:
        remaining = max(0, max(graduation_years) - current_year)
        year_of_study = f"Year {max(1, min(3, 3 - remaining))}"

    months = {name.lower(): number for number, name in enumerate(["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], 1)}
    months.update({name[:3].lower(): number for name, number in list(months.items())})
    placement_start = placement_end = ""
    for line in lines:
        if re.search(r"internship|industrial training|placement", line, re.I):
            range_match = re.search(r"([A-Za-z]{3,9})\s+(20\d{2})\s*(?:-|–|to|—)\s*([A-Za-z]{3,9})\s+(20\d{2})", line, re.I)
            if range_match and range_match.group(1).lower()[:3] in months and range_match.group(3).lower()[:3] in months:
                placement_start = f"{range_match.group(2)}-{months[range_match.group(1).lower()[:3]]:02d}-01"
                end_month = months[range_match.group(3).lower()[:3]]
                end_day = calendar.monthrange(int(range_match.group(4)), end_month)[1]
                placement_end = f"{range_match.group(4)}-{end_month:02d}-{end_day:02d}"
                break
            iso_range = re.search(r"(20\d{2}-\d{2}-\d{2})\s*(?:-|–|to|—)\s*(20\d{2}-\d{2}-\d{2})", line)
            if iso_range:
                placement_start, placement_end = iso_range.groups()
                break

    catalog = ["Python", "Java", "JavaScript", "TypeScript", "React", "SQL", "Power BI", "Excel", "C++", "C#", "AWS", "Azure", "Machine Learning", "Git", "Linux", "Figma", "Communication", "Data Analytics", "UI/UX", "HTML", "CSS", "Node.js", "Docker", "Tableau", "AutoCAD", "Adobe Photoshop", "Illustrator", "Project Management", "Research", "SPSS", "MySQL", "PostgreSQL"]
    skills = sorted({skill for skill in catalog if re.search(rf"(?<!\w){re.escape(skill)}(?!\w)", normalized_text, re.I)})
    for line in sections["skills"]:
        for item in re.split(r"[,;|•·]", line):
            clean = item.strip()
            if 1 < len(clean) < 48 and clean.lower() not in {skill.lower() for skill in skills}:
                skills.append(clean)

    def extract_records(items: list[str], kind: str) -> list[dict[str, Any]]:
        groups = blocks(items)
        output = []
        for index, group in enumerate(groups):
            if not group:
                continue
            joined = " ".join(group)
            date_text = re.search(
                r"(?:[A-Za-z]+\s+)?20\d{2}\s*(?:-|–|to|—)\s*"
                r"(?:Present|Current|(?:[A-Za-z]+\s+)?20\d{2})",
                joined,
                re.I,
            )
            period = date_text.group(0) if date_text else ""
            first = group[0]
            if kind == "experience":
                organization = next((line for line in group[1:] if re.search(r"\b(?:Sdn\.? Bhd\.?|Ltd\.?|Inc\.?|University|College|Company|Organization|Bank|Technologies|Solutions)\b", line, re.I)), group[1] if len(group) > 1 else "")
                summary_lines = [line for line in group[1:] if line != organization and line != period]
                output.append({"id": f"exp-cv-{index+1}", "role": first, "organization": organization, "period": period, "summary": " ".join(summary_lines)})
            elif kind == "project":
                summary = " ".join(group[1:])
                stack = [skill for skill in skills if skill.lower() in joined.lower()]
                output.append({"id": f"prj-cv-{index+1}", "title": first, "role": "Student", "techStack": stack, "summary": summary or joined})
            else:
                issuer = group[1] if len(group) > 1 else ""
                date_value = next((re.search(r"\b(?:19|20)\d{2}\b", line).group(0) for line in group if re.search(r"\b(?:19|20)\d{2}\b", line)), "")
                output.append({"id": f"cert-cv-{index+1}", "name": first, "issuer": issuer, "date": date_value})
        return output

    summary = " ".join(sections["summary"]).strip()
    if not summary:
        skill_phrase = ", ".join(skills[:6]) if skills else "a developing set of professional and academic skills"
        experience_phrase = "work and project experience" if sections["experience"] or sections["projects"] else "coursework and academic projects"
        summary = f"{name} is a {year_of_study.lower() + ' ' if year_of_study else ''}{major or 'university'} student with experience in {experience_phrase}. Skills include {skill_phrase}. Ready to contribute these strengths to an internship while continuing to develop professionally."

    return {
        "name": name, "studentId": student_id, "email": profile_email, "degree": degree, "major": major,
        "yearOfStudy": year_of_study, "graduationStatus": "Current Student", "bio": summary, "skills": skills,
        "careerInterests": [], "preferredIndustries": [], "preferredLocations": [location] if location else [],
        "internshipAvailability": "", "internshipStartDate": placement_start, "internshipEndDate": placement_end,
        "openToMatches": True, "cvFileName": None, "cvUpdatedDate": None, "projects": extract_records(sections["projects"], "project"),
        "certifications": extract_records(sections["certifications"], "certification"), "education": education_rows,
        "workExperience": extract_records(sections["experience"], "experience"),
    }


@app.post("/api/v1/career-guidance/requests", status_code=201)
async def create_career_request(
    request_type: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    programme: str = Form(...),
    details: str = Form(""),
    interviewer_type: str = Form(""),
    interviewer_name: str = Form(""),
    interviewer_email: str = Form(""),
    preferred_time: str = Form(""),
    upload: UploadFile | None = File(None),
    account: Account = Depends(require_role("student")),
) -> dict[str, Any]:
    if request_type not in {"cv_review", "mock_interview", "event_interest"}:
        raise HTTPException(422, "Choose a valid request type")
    if email.strip().lower() != account.email:
        raise HTTPException(422, "Use the email address on your signed-in account")
    if request_type == "cv_review" and not upload:
        raise HTTPException(422, "Attach your CV")
    if request_type == "mock_interview" and interviewer_type in {"Student peer", "Professor"}:
        if not interviewer_name.strip() or "@" not in interviewer_email:
            raise HTTPException(422, "Enter the chosen interviewer’s name and email")
    stored_name = stored_path = None
    if upload:
        if upload.size and upload.size > 5_000_000:
            raise HTTPException(413, "Attachment must be 5 MB or smaller")
        suffix = Path(upload.filename or "").suffix.lower()
        if request_type == "cv_review" and suffix not in {".pdf", ".doc", ".docx"}:
            raise HTTPException(415, "Upload a PDF, DOC, or DOCX CV")
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        stored_name = f"{uuid.uuid4().hex}{suffix}"
        target = UPLOAD_DIR / stored_name
        target.write_bytes(await upload.read())
        stored_path = str(target)
    request_id = str(uuid.uuid4())
    created_at = datetime.utcnow()
    request = CareerRequest(id=request_id, student_id=account.id, request_type=request_type, created_at=created_at,
        data={"name": name.strip(), "email": account.email, "programme": programme.strip(), "details": details.strip(), "interviewerType": interviewer_type, "interviewerName": interviewer_name.strip(), "preferredTime": preferred_time.strip()},
        uploaded_file_name=upload.filename if upload else None, uploaded_file_path=stored_path)
    if request_type == "mock_interview" and interviewer_type in {"Student peer", "Professor"}:
        return {
            "id": request_id,
            "requestType": request_type,
            "createdAt": created_at.isoformat(),
            "status": "email_sent",
            "delivery": "direct_email",
            "emailRecipient": interviewer_email.strip(),
            "emailRecipientName": interviewer_name.strip(),
            "emailSubject": f"APU NEXT | Mock interview request from {account.name}",
            "emailBody": f"Hi {interviewer_name.strip()},\n\n{account.name} would like to arrange a mock interview.\nPreferred time: {preferred_time.strip() or 'To be arranged'}\n\nRegards\nAPU NEXT",
        }
    try:
        with Session(engine) as db:
            db.add(request)
            db.commit()
    except Exception:
        if stored_path:
            Path(stored_path).unlink(missing_ok=True)
        raise
    subject_label = {"cv_review": "CV review", "mock_interview": "Mock interview", "event_interest": "Event interest"}[request_type]
    email_recipient: str | None = None
    if request_type == "mock_interview" and interviewer_type in {"Student peer", "Professor"}:
        email_recipient = interviewer_email.strip()
        subject_label = f"Mock interview request for {interviewer_name.strip() or interviewer_type}"
    message = f"Request from {account.name} ({account.email})\nProgramme: {programme.strip()}\nType: {request_type}\nDetails: {details.strip()}\nPreferred time: {preferred_time.strip()}"
    with Session(engine) as db:
        saved = db.get(CareerRequest, request_id)
        if not saved:
            raise HTTPException(500, "The request was not saved")
        saved.data = {
            **saved.data,
            "delivery": "career_centre_portal",
            "emailRecipient": email_recipient,
        }
        db.commit()
    return {
        "id": request_id,
        "requestType": request_type,
        "createdAt": created_at.isoformat(),
        "status": "received",
        "delivery": "career_centre_portal",
        "emailRecipient": email_recipient,
        "emailSubject": f"APU NEXT Request | {subject_label}" if email_recipient else None,
        "emailBody": message if email_recipient else None,
    }


@app.get("/api/v1/career-guidance/requests")
def list_career_requests(account: Account = Depends(require_role("student"))) -> list[dict[str, Any]]:
    with Session(engine) as db:
        rows = db.scalars(select(CareerRequest).where(CareerRequest.student_id == account.id).order_by(CareerRequest.created_at.desc())).all()
        return [{"id": row.id, "requestType": row.request_type, "data": row.data, "fileName": row.uploaded_file_name, "createdAt": row.created_at.isoformat(), "status": row.data.get("emailStatus", "received")} for row in rows]


@app.get("/api/v1/admin/career-guidance/requests")
def list_admin_career_requests(account: Account = Depends(require_role("admin"))) -> list[dict[str, Any]]:
    with Session(engine) as db:
        rows = db.scalars(select(CareerRequest).where(CareerRequest.request_type != "event_interest").order_by(CareerRequest.created_at.desc())).all()
        return [
            {
                "id": row.id,
                "requestType": row.request_type,
                "data": row.data,
                "fileName": row.uploaded_file_name,
                "hasAttachment": bool(row.uploaded_file_path and Path(row.uploaded_file_path).is_file()),
                "createdAt": row.created_at.isoformat(),
                "status": row.data.get("emailStatus", "received"),
            }
            for row in rows
        ]


@app.get("/api/v1/admin/career-guidance/requests/{request_id}/cv")
def download_career_request_cv(request_id: str, account: Account = Depends(require_role("admin"))) -> FileResponse:
    with Session(engine) as db:
        request = db.get(CareerRequest, request_id)
        if not request or not request.uploaded_file_path or not Path(request.uploaded_file_path).is_file():
            raise HTTPException(404, "Attached CV not found")
        path = Path(request.uploaded_file_path)
        return FileResponse(path, filename=request.uploaded_file_name or path.name)


@app.post("/api/v1/admin/career-guidance/requests/{request_id}/email")
def email_career_request(
    request_id: str,
    payload: CareerRequestEmailPayload,
    account: Account = Depends(require_role("admin")),
) -> dict[str, Any]:
    with Session(engine) as db:
        request = db.get(CareerRequest, request_id)
        if not request:
            raise HTTPException(404, "Career request not found")
        student_email = str(request.data.get("email", "")).strip()
        student_name = str(request.data.get("name", "student")).strip() or "student"
        if not student_email or "@" not in student_email:
            raise HTTPException(422, "The request does not contain a valid student email")

        if payload.action != request.request_type:
            raise HTTPException(422, "This email action does not match the request type")

        event_details = os.getenv(
            "EVENT_DETAILS",
            "18 November 2026, 8:00 AM–3:30 PM, Auditorium 5, Level 3. Bring the QR confirmation to the entrance.",
        )
        if payload.action == "event_interest":
            subject = "APU NEXT | Event registration confirmation"
            body = f"Hi {student_name},\n\nYour interest in the SD Guthrie Industry Visit has been received.\n\nEvent details:\n{event_details}\n\nYour QR confirmation is attached. Please show it at the entrance.\n\nRegards,\nAPU NEXT Career Centre"
            status = send_email(student_email, subject, body, attachment_path=str(EVENT_QR_PATH))
        elif payload.action == "mock_interview":
            link = os.getenv("MOCK_INTERVIEW_SCHEDULING_URL", "https://docs.google.com/forms/d/e/1FAIpQLScPAPORcTC9u0JMkn5DEf8DYUvGA2axDPrCAzrZSTilLJDfXA/viewform")
            subject = "APU NEXT | Choose your mock interview date"
            body = f"Hi {student_name},\n\nPlease choose a date through the link attached for your mock interview with the career admin. {link}\n\nRegards\nAPU NEXT Career Centre"
            status = send_email(student_email, subject, body)
        else:
            review = os.getenv(
                "CV_REVIEW_MESSAGE",
                "Your CV review is complete.\nYour experience is clearly presented.\nConsider adding more measurable achievements.\nPlease review your profile for further career guidance.",
            )
            subject = "APU NEXT | Your CV review"
            status = send_email(student_email, subject, f"Hi {student_name},\n\n{review}\n\nRegards,\nAPU NEXT Career Centre")

        if status != "sent":
            detail = "Email delivery is not configured" if status == "not_configured" else "The email provider rejected or could not deliver the message"
            raise HTTPException(503, detail)
        request.data = {**request.data, "emailStatus": "sent", "emailAction": payload.action, "emailSentAt": datetime.utcnow().isoformat()}
        db.commit()
        return {"status": "sent", "requestId": request_id, "recipient": student_email}


@app.get("/api/v1/opportunities")
def list_opportunities(status: str = "Approved", account: Account = Depends(current_account)) -> list[dict[str, Any]]:
    if status != "Approved" and account.role != "admin":
        raise HTTPException(403, "Only Career Centre staff can view unpublished opportunities")
    with Session(engine) as db:
        items = db.scalars(select(OpportunityRecord).where(OpportunityRecord.status == status)).all()
        return [student_opportunity_view(item.data) if account.role == "student" else item.data for item in items]


_STUDENT_HIDDEN_OPPORTUNITY_FIELDS = {
    "sourceLabel", "sourceType", "careerjetListingId", "careerjetFingerprint", "careerjetOriginalUrl",
    "careerjetDate", "careerjetSite", "careerjetSearchProgrammeId",
    "importedAt", "lastCheckedAt", "reviewStatus", "reviewReason",
    "publishedAt", "availabilityStatus", "availabilityCheckMessage",
}


def student_opportunity_view(data: dict[str, Any]) -> dict[str, Any]:
    visible = {key: value for key, value in data.items() if key not in _STUDENT_HIDDEN_OPPORTUNITY_FIELDS}
    if data.get("sourceType") == "careerjet":
        visible.pop("sourceUrl", None)
    return visible


def careerjet_search(request: Request, keywords: str, location: str, page: int) -> dict[str, Any]:
    api_key = os.getenv("CAREERJET_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(503, "Careerjet search is not configured. Add CAREERJET_API_KEY to backend/.env.")

    user_ip = request.client.host if request.client else ""
    if user_ip in ("127.0.0.1", "::1", "localhost"):
        user_ip = os.getenv("CAREERJET_USER_IP", "").strip()
    if not user_ip:
        raise HTTPException(
            503,
            "Careerjet requires the searcher's IP address. For local testing, set CAREERJET_USER_IP in backend/.env to your public IP, or test from the configured public site.",
        )

    user_agent = request.headers.get("user-agent", "").strip()
    referer = os.getenv("CAREERJET_PUBLISHER_URL", "").strip() or request.headers.get("referer", "").strip()
    parsed_referer = urlparse(referer)
    if not user_agent or parsed_referer.scheme not in {"http", "https"} or not parsed_referer.netloc:
        raise HTTPException(400, "Careerjet requires a browser user-agent and publisher page URL.")

    params = urlencode({
        "locale_code": "en_MY",
        "keywords": keywords.strip(),
        "location": location.strip(),
        "user_ip": user_ip,
        "user_agent": user_agent,
        "page": page,
        "pagesize": 10,
    })
    credentials = base64.b64encode(f"{api_key}:".encode()).decode("ascii")
    upstream_request = urllib_request.Request(
        f"{CAREERJET_API_URL}?{params}",
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
            "Referer": referer,
        },
        method="GET",
    )
    try:
        with urllib_request.urlopen(upstream_request, timeout=10) as response:
            data = json.loads(response.read())
    except urllib_error.HTTPError as error:
        try:
            response_body = json.loads(error.read(2048))
        except (json.JSONDecodeError, UnicodeDecodeError):
            response_body = {}
        upstream_message = response_body.get("error", "") if isinstance(response_body, dict) else ""
        if error.code == 403:
            denied_ip = re.fullmatch(
                r"Unauthorized access from IP\s+([0-9a-fA-F:.]+)",
                upstream_message.strip(),
                re.IGNORECASE,
            )
            if denied_ip:
                raise HTTPException(
                    502,
                    f"Careerjet rejected the requester IP sent in user_ip ({denied_ip.group(1)}). Check that CAREERJET_USER_IP is the searcher's current public IP; if it is correct, ask Careerjet whether this IP is authorized for the publisher API key.",
                ) from error
            raise HTTPException(
                502,
                "Careerjet denied the request (HTTP 403). Verify that the API key is active and CAREERJET_PUBLISHER_URL exactly matches a page on the publisher website registered to that key.",
            ) from error
        raise HTTPException(502, f"Careerjet search failed (HTTP {error.code}). Please try again later.") from error
    except urllib_error.URLError as error:
        raise HTTPException(502, "Careerjet could not be reached. Check the backend's internet connection and try again.") from error
    except (TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as error:
        raise HTTPException(502, "Careerjet returned an invalid response or timed out. Please try again.") from error

    if not isinstance(data, dict):
        raise HTTPException(502, "Careerjet returned an unexpected response.")
    jobs = data.get("jobs", [])
    if not isinstance(jobs, list):
        jobs = []
    return {
        "type": data.get("type", ""),
        "hits": data.get("hits", 0),
        "message": data.get("message", ""),
        "pages": data.get("pages", 0),
        "page": page,
        "jobs": [job for job in jobs if isinstance(job, dict)],
        "locations": data.get("locations", []),
    }


@app.post("/api/v1/admin/careerjet/discover")
def discover_careerjet_opportunities(
    payload: CareerjetDiscoveryPayload,
    request: Request,
    account: Account = Depends(require_role("admin")),
) -> dict[str, Any]:
    programme = get_programme(payload.programme_id)
    if not programme or not programme["active"]:
        raise HTTPException(422, "Choose an active programme from the APU catalogue")
    selected_skills = list(dict.fromkeys(payload.skills))
    invalid_skills = [skill for skill in selected_skills if skill not in programme["skills"]]
    if invalid_skills:
        raise HTTPException(422, "Choose suggested skills from the selected programme")

    terms: list[str] = []
    if selected_skills:
        terms = [f"{keyword} internship {skill}" for keyword in programme["searchKeywords"][:2] for skill in selected_skills[:2]]
    else:
        terms = [f"{keyword} internship" for keyword in programme["searchKeywords"][:3]]
    queries = list(dict.fromkeys(term.strip() for term in terms if term.strip()))[:3]

    jobs: list[dict[str, Any]] = []
    locations: list[str] = []
    total_hits = 0
    pages = 0
    seen: set[str] = set()
    for query in queries:
        result = careerjet_search(request, query, payload.location, payload.page)
        total_hits += int(result.get("hits") or 0)
        pages = max(pages, int(result.get("pages") or 0))
        locations.extend(value for value in result.get("locations", []) if isinstance(value, str))
        for job in result["jobs"]:
            url = str(job.get("url") or "").strip().lower().rstrip("/")
            title_key = re.sub(r"\W+", " ", str(job.get("title") or "").lower()).strip()
            company_key = re.sub(r"\W+", " ", str(job.get("company") or "").lower()).strip()
            key = url or f"{title_key}|{company_key}"
            if key and key not in seen:
                seen.add(key)
                jobs.append(job)

    return {
        "type": "JOBS",
        "hits": len(jobs),
        "totalHits": total_hits,
        "message": f"{len(jobs)} distinct listings found across {len(queries)} programme searches",
        "pages": pages,
        "page": payload.page,
        "hasMore": pages > payload.page,
        "queries": queries,
        "jobs": jobs,
        "locations": list(dict.fromkeys(locations)),
    }


@app.get("/api/v1/admin/careerjet/opportunities")
def list_careerjet_opportunities(
    status: str = Query(default="all", pattern="^(all|Pending Review|Approved|Rejected|Archived)$"),
    account: Account = Depends(require_role("admin")),
) -> dict[str, Any]:
    with Session(engine) as db:
        items = [
            item for item in db.scalars(select(OpportunityRecord)).all()
            if item.data.get("sourceType") == "careerjet"
            and (status == "all" or item.status == status)
        ]
        return {
            "stats": {
                "imported": len(items),
                "pending": sum(item.status == "Pending Review" for item in items),
                "published": sum(item.status == "Approved" for item in items),
            },
            "opportunities": [
                {"opportunity": item.data, "status": item.status, "importedAt": item.data.get("importedAt"), "lastCheckedAt": item.data.get("lastCheckedAt")}
                for item in sorted(items, key=lambda row: row.created_at, reverse=True)
            ],
        }


def _plain_listing_text(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", " ", value))).strip()


def _normalised_duplicate_text(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").lower()).strip()


@app.post("/api/v1/admin/careerjet/import")
def import_careerjet_opportunity(
    payload: CareerjetImportPayload,
    account: Account = Depends(require_role("admin")),
) -> dict[str, Any]:
    programme = get_programme(payload.programme_id)
    if not programme:
        raise HTTPException(422, "Choose a programme from the APU catalogue")
    job = payload.job
    original_url = str(job.get("url") or "").strip()
    parsed_url = urlparse(original_url)
    if parsed_url.scheme != "https" or not parsed_url.netloc:
        raise HTTPException(422, "This listing does not include a valid secure application URL")

    title = _plain_listing_text(job.get("title"))
    company = _plain_listing_text(job.get("company"))
    location = _plain_listing_text(job.get("locations"))
    description = _plain_listing_text(job.get("description"))
    fingerprint = hashlib.sha256(original_url.rstrip("/").lower().encode()).hexdigest()
    external_id = str(job.get("id") or "").strip() or None
    title_key, company_key, location_key = map(_normalised_duplicate_text, (title, company, location))
    with Session(engine) as db:
        existing_items = db.scalars(select(OpportunityRecord)).all()
        duplicate = next((item for item in existing_items if
            external_id is not None and item.data.get("careerjetListingId") == external_id
            or str(item.data.get("careerjetOriginalUrl", item.data.get("applicationUrl", ""))).rstrip("/").lower() == original_url.rstrip("/").lower()
            or (
                title_key and company_key and location_key
                and _normalised_duplicate_text(item.data.get("title")) == title_key
                and _normalised_duplicate_text(item.data.get("company")) == company_key
                and _normalised_duplicate_text(item.data.get("location")) == location_key
            )
        ), None)
        if duplicate:
            return {"duplicate": True, "opportunity": duplicate.data, "status": duplicate.status}

        opportunity_id = f"careerjet-{fingerprint[:20]}"
        found_skills = [skill for skill in programme["skills"] if skill.lower() in description.lower()]
        imported_at = datetime.utcnow().isoformat()
        data = {
            "id": opportunity_id,
            "title": title,
            "company": company,
            "logoKey": "",
            "industry": "",
            "location": location,
            "workMode": "Not specified",
            "roleType": "Internship",
            "degreeTarget": programme["name"],
            "experienceLevel": "",
            "duration": "",
            "allowance": _plain_listing_text(job.get("salary")),
            "deadline": "",
            "matchScore": 0,
            "matchExplanation": "",
            "skills": found_skills,
            "summary": description,
            "responsibilities": [],
            "requirements": [],
            "isDemoListing": False,
            "approvalStatus": "Pending Review",
            "postedByEmployer": False,
            "sourceType": "careerjet",
            "sourceLabel": "Careerjet import",
            "sourceUrl": original_url,
            "applicationUrl": original_url,
            "applicationMode": "external",
            "eligibleMajors": [programme["name"]],
            "careerjetListingId": external_id,
            "careerjetFingerprint": fingerprint,
            "careerjetOriginalUrl": original_url,
            "careerjetDate": _plain_listing_text(job.get("date")),
            "careerjetSite": _plain_listing_text(job.get("site")),
            "careerjetSearchProgrammeId": programme["id"],
            "importedAt": imported_at,
            "lastCheckedAt": imported_at,
            "reviewStatus": "Pending Review",
            "reviewReason": "",
            "availabilityStatus": "Found in Careerjet search",
            "availabilityCheckMessage": "",
        }
        db.add(OpportunityRecord(id=opportunity_id, status="Pending Review", data=data))
        db.add(ApprovalEvent(id=f"{opportunity_id}:imported", opportunity_id=opportunity_id, action="imported_from_careerjet", actor=account.id))
        db.commit()
        return {"duplicate": False, "opportunity": data, "status": "Pending Review"}


@app.put("/api/v1/admin/careerjet/opportunities/{opportunity_id}/decision")
def decide_careerjet_opportunity(
    opportunity_id: str,
    payload: CareerjetDecisionPayload,
    account: Account = Depends(require_role("admin")),
) -> dict[str, Any]:
    with Session(engine) as db:
        item = db.get(OpportunityRecord, opportunity_id)
        if not item or item.data.get("sourceType") != "careerjet":
            raise HTTPException(404, "Careerjet opportunity not found")
        if payload.action == "archive":
            if item.status == "Archived":
                raise HTTPException(409, "Opportunity is already archived")
            item.status = "Archived"
            item.data = {**item.data, "approvalStatus": "Archived", "reviewStatus": "Archived"}
            event_action = "careerjet_archived"
        else:
            if item.status != "Pending Review":
                raise HTTPException(409, "Only pending opportunities can be approved or rejected")
            if payload.action == "approve":
                item.status = "Approved"
                item.data = {**item.data, "approvalStatus": "Approved", "reviewStatus": "Approved", "publishedAt": datetime.utcnow().isoformat()}
                event_action = "careerjet_approved"
            else:
                item.status = "Rejected"
                item.data = {**item.data, "approvalStatus": "Rejected", "reviewStatus": "Rejected", "reviewReason": payload.reason.strip()}
                event_action = "careerjet_rejected"

        db.add(ApprovalEvent(id=f"{opportunity_id}:{event_action}:{uuid.uuid4().hex[:8]}", opportunity_id=opportunity_id, action=event_action, actor=account.id))
        matches = []
        if payload.action == "approve":
            for student in db.scalars(select(Student)).all():
                recompute(db, student.id)
            rows = db.scalars(select(Match).where(Match.opportunity_id == opportunity_id, Match.score >= 80)).all()
            for row in rows:
                notify_student_match(db, row.student_id, item.data, row.score)
                matches.append({"studentId": row.student_id, "score": row.score, "reasons": row.reasons})
        db.commit()
        return {"opportunity": item.data, "status": item.status, "matches": matches}


@app.post("/api/v1/admin/careerjet/opportunities/{opportunity_id}/refresh")
def refresh_careerjet_opportunity(
    opportunity_id: str,
    request: Request,
    account: Account = Depends(require_role("admin")),
) -> dict[str, Any]:
    with Session(engine) as db:
        item = db.get(OpportunityRecord, opportunity_id)
        if not item or item.data.get("sourceType") != "careerjet":
            raise HTTPException(404, "Careerjet opportunity not found")
        query = str(item.data.get("title") or "").strip()[:100]
        location = str(item.data.get("location") or "").strip()[:100]
        if len(query) < 2 or len(location) < 2:
            raise HTTPException(422, "The listing needs a title and location to be checked")
        result = careerjet_search(request, query, location, 1)
        original_url = str(item.data.get("careerjetOriginalUrl") or "").rstrip("/").lower()
        found = any(str(job.get("url") or "").rstrip("/").lower() == original_url for job in result["jobs"])
        checked_at = datetime.utcnow().isoformat()
        availability = "Found in recent Careerjet search" if found else "Needs manual review"
        message = "" if found else "The listing was not found in this exact-title search; Careerjet search results cannot confirm that it has expired."
        item.data = {**item.data, "lastCheckedAt": checked_at, "availabilityStatus": availability, "availabilityCheckMessage": message}
        db.add(ApprovalEvent(id=f"{opportunity_id}:refreshed:{uuid.uuid4().hex[:8]}", opportunity_id=opportunity_id, action="careerjet_refreshed", actor=account.id))
        db.commit()
        return {"opportunity": item.data, "availabilityStatus": availability}


@app.post("/api/v1/opportunities", status_code=201)
def create_opportunity(payload: OpportunityPayload, account: Account = Depends(require_role("admin"))) -> dict[str, Any]:
    data = dict(payload.opportunity)
    data.update({"approvalStatus": "Approved", "postedByEmployer": False, "isDemoListing": False})
    data.setdefault("sourceLabel", "Career Centre listing")
    data.setdefault("id", f"staff-{uuid.uuid4().hex[:12]}")
    with Session(engine) as db:
        item = OpportunityRecord(id=data["id"], status="Approved", data=data)
        db.add(item)
        db.add(ApprovalEvent(id=f"{data['id']}:published", opportunity_id=data["id"], action="published_by_career_centre", actor=account.id))
        db.flush()
        matched = []
        for student in db.scalars(select(Student)).all():
            result = match_score(student.data, data)
            if result and result["score"] >= 80:
                db.merge(Match(id=f"{student.id}:{data['id']}", student_id=student.id, opportunity_id=data["id"], score=result["score"], components=result["components"], reasons=result["reasons"]))
                matched.append({"studentId": student.id, **result})
                notify_student_match(db, student.id, data, result["score"])
        db.commit()
        return {"opportunity": data, "matches": matched}


@app.post("/api/v1/employer/opportunities", status_code=201)
def submit_employer_opportunity(payload: OpportunityPayload, account: Account = Depends(require_role("employer"))) -> dict[str, Any]:
    data = dict(payload.opportunity)
    profile = account.employer_profile or {}
    data["company"] = str(profile.get("companyName") or account.name)
    data.update({"id": f"employer-{uuid.uuid4().hex[:12]}", "approvalStatus": "Pending Review", "postedByEmployer": True, "isDemoListing": False, "sourceLabel": f"Employer listing · {account.id}"})
    with Session(engine) as db:
        db.add(OpportunityRecord(id=data["id"], status="Pending Review", data=data))
        db.add(ApprovalEvent(id=f"{data['id']}:submitted", opportunity_id=data["id"], action="submitted_by_employer", actor=account.id))
        db.commit()
    return {"opportunity": data, "status": "Pending Review"}


@app.get("/api/v1/employer/opportunities")
def list_own_employer_opportunities(account: Account = Depends(require_role("employer"))) -> list[dict[str, Any]]:
    with Session(engine) as db:
        return [item.data for item in db.scalars(select(OpportunityRecord)).all() if item.data.get("sourceLabel") == f"Employer listing · {account.id}"]


def employer_owned_opportunity(db: Session, account: Account, opportunity_id: str) -> OpportunityRecord:
    opportunity = db.get(OpportunityRecord, opportunity_id)
    if not opportunity or opportunity.data.get("sourceLabel") != f"Employer listing · {account.id}":
        raise HTTPException(404, "Company listing not found")
    return opportunity


@app.get("/api/v1/employer/opportunities/{opportunity_id}/applications")
def employer_applications(opportunity_id: str, account: Account = Depends(require_role("employer"))) -> list[dict[str, Any]]:
    with Session(engine) as db:
        employer_owned_opportunity(db, account, opportunity_id)
        applications = db.scalars(select(StudentApplication).where(StudentApplication.opportunity_id == opportunity_id).order_by(StudentApplication.applied_at.desc())).all()
        result = []
        for application in applications:
            student_account = db.get(Account, application.student_id)
            student = db.get(Student, application.student_id)
            if not student_account or not student or student_account.role != "student":
                continue
            profile = student.data
            result.append({
                "id": application.id,
                "status": application.status,
                "note": application.note,
                "appliedAt": application.applied_at.isoformat(),
                "resumeShared": application.cv_share_consent,
                "resumeAvailable": bool(application.cv_share_consent and student.cv_file_path and Path(student.cv_file_path).is_file()),
                "student": {
                    "name": student_account.name,
                    "degree": profile.get("degree", ""),
                    "major": profile.get("major", ""),
                    "yearOfStudy": profile.get("yearOfStudy", ""),
                    "bio": profile.get("bio", ""),
                    "skills": profile.get("skills", []),
                    "careerInterests": profile.get("careerInterests") or [],
                    "languages": profile.get("languages") or [],
                    "internshipAvailability": profile.get("internshipAvailability", ""),
                    "projects": profile.get("projects") or [],
                    "certifications": profile.get("certifications") or [],
                    "workExperience": profile.get("workExperience") or [],
                },
            })
        return result


@app.put("/api/v1/employer/applications/{application_id}/status")
def update_employer_application_status(application_id: str, payload: ApplicationStatusPayload, account: Account = Depends(require_role("employer"))) -> dict[str, str]:
    with Session(engine) as db:
        application = db.get(StudentApplication, application_id)
        if not application:
            raise HTTPException(404, "Application not found")
        employer_owned_opportunity(db, account, application.opportunity_id)
        application.status = payload.status
        db.commit()
        return {"id": application.id, "status": application.status}


@app.get("/api/v1/employer/applications/{application_id}/cv")
def employer_application_cv(application_id: str, account: Account = Depends(require_role("employer"))) -> FileResponse:
    with Session(engine) as db:
        application = db.get(StudentApplication, application_id)
        if not application:
            raise HTTPException(404, "Application not found")
        employer_owned_opportunity(db, account, application.opportunity_id)
        if not application.cv_share_consent:
            raise HTTPException(403, "The student has not consented to share their CV")
        student = db.get(Student, application.student_id)
        if not student or not student.cv_file_path or not Path(student.cv_file_path).is_file():
            raise HTTPException(404, "Shared CV is not available")
        return FileResponse(student.cv_file_path, filename=student.cv_file_name or Path(student.cv_file_path).name)


@app.get("/api/v1/admin/opportunities/pending")
def pending_employer_opportunities(account: Account = Depends(require_role("admin"))) -> list[dict[str, Any]]:
    with Session(engine) as db:
        return [item.data for item in db.scalars(select(OpportunityRecord).where(OpportunityRecord.status == "Pending Review")).all()]


@app.get("/api/v1/admin/opportunities/summary")
def admin_summary(account: Account = Depends(require_role("admin"))) -> list[dict[str, Any]]:
    with Session(engine) as db:
        result = []
        for opp in db.scalars(select(OpportunityRecord)).all():
            if opp.status != "Approved":
                continue
            matches = db.scalars(select(Match).where(Match.opportunity_id == opp.id, Match.score >= 80)).all()
            details = []
            for row in matches:
                student = db.get(Student, row.student_id)
                if student:
                    skills = {str(value).lower() for value in student.data.get("skills", [])}
                    matched_skills = [value for value in opp.data.get("skills", []) if str(value).lower() in skills]
                    details.append({"studentId": student.id, "studentName": student.data.get("name", student.id), "programme": f"{student.data.get('degree', '')} · {student.data.get('major', '')}", "matchedSkills": matched_skills, "score": row.score, "components": row.components, "reasons": row.reasons, "response": row.response})
            result.append({"opportunity": opp.data, "strongMatches": len(matches), "interested": sum(x.response == "interested" for x in matches), "passed": sum(x.response == "passed" for x in matches), "matches": details})
        return result


@app.get("/api/v1/admin/opportunities/{opportunity_id}")
def admin_opportunity_detail(opportunity_id: str, account: Account = Depends(require_role("admin"))) -> dict[str, Any]:
    with Session(engine) as db:
        opportunity = db.get(OpportunityRecord, opportunity_id)
        if not opportunity:
            raise HTTPException(404, "Vacancy not found")
        source_label = str(opportunity.data.get("sourceLabel", ""))
        employer_id = source_label.removeprefix("Employer listing · ")
        employer = db.get(Account, employer_id) if source_label.startswith("Employer listing") else None
        events = db.scalars(select(ApprovalEvent).where(ApprovalEvent.opportunity_id == opportunity_id).order_by(ApprovalEvent.created_at)).all()
        applications = db.scalars(select(StudentApplication).where(StudentApplication.opportunity_id == opportunity_id)).all()
        applicant_rows = []
        for application in applications:
            student_account = db.get(Account, application.student_id)
            if student_account and student_account.role == "student":
                applicant_rows.append({
                    "applicationId": application.id,
                    "studentId": student_account.id,
                    "name": student_account.name,
                    "status": application.status,
                    "appliedAt": application.applied_at.isoformat(),
                    "resumeShared": application.cv_share_consent,
                })
        return {
            "opportunity": opportunity.data,
            "status": opportunity.status,
            "submittedAt": opportunity.created_at.isoformat(),
            "company": ({
                "id": employer.id,
                "name": employer.name,
                "email": employer.email,
                "profile": employer.employer_profile or {},
                "approvalStatus": employer.approval_status,
            } if employer else None),
            "applicationCount": len(applications),
            "applicants": applicant_rows,
            "approvalHistory": [{"action": event.action, "actor": event.actor, "createdAt": event.created_at.isoformat()} for event in events],
        }


@app.put("/api/v1/admin/opportunities/{opportunity_id}/decision")
def decide_employer_opportunity(opportunity_id: str, payload: OpportunityDecisionPayload, account: Account = Depends(require_role("admin"))) -> dict[str, Any]:
    with Session(engine) as db:
        item = db.get(OpportunityRecord, opportunity_id)
        if not item or item.status != "Pending Review":
            raise HTTPException(404, "Pending employer listing not found")
        approved = payload.decision == "approve"
        item.status = "Approved" if approved else "Rejected"
        item.data = {**item.data, "approvalStatus": item.status}
        db.add(ApprovalEvent(id=f"{opportunity_id}:decision:{uuid.uuid4().hex[:8]}", opportunity_id=opportunity_id, action=f"employer_listing_{payload.decision}d", actor=account.id))
        matched = []
        if approved:
            for student in db.scalars(select(Student)).all():
                result = match_score(student.data, item.data)
                if result and result["score"] >= 80:
                    db.merge(Match(id=f"{student.id}:{item.id}", student_id=student.id, opportunity_id=item.id, score=result["score"], components=result["components"], reasons=result["reasons"]))
                    matched.append({"studentId": student.id, "score": result["score"]})
                    notify_student_match(db, student.id, item.data, result["score"])
        db.commit()
        return {"opportunity": item.data, "matches": matched}


@app.put("/api/v1/opportunities/{opportunity_id}")
def update_opportunity(opportunity_id: str, payload: OpportunityPayload, account: Account = Depends(require_role("admin"))) -> dict[str, Any]:
    data = dict(payload.opportunity)
    data.update({"id": opportunity_id, "approvalStatus": "Approved", "postedByEmployer": False, "isDemoListing": False})
    data.setdefault("sourceLabel", "Career Centre listing")
    with Session(engine) as db:
        item = db.get(OpportunityRecord, opportunity_id)
        if not item:
            raise HTTPException(404, "Opportunity not found")
        item.data, item.status = data, "Approved"
        db.add(ApprovalEvent(id=f"{opportunity_id}:updated:{uuid.uuid4().hex[:8]}", opportunity_id=opportunity_id, action="career_centre_updated", actor=account.id))
        db.flush()
        for student in db.scalars(select(Student)).all():
            recompute(db, student.id)
        rows = db.scalars(select(Match).where(Match.opportunity_id == opportunity_id, Match.score >= 80)).all()
        matches = [{"studentId": row.student_id, "score": row.score, "components": row.components, "reasons": row.reasons} for row in rows]
        db.commit()
        return {"opportunity": item.data, "matches": matches}


@app.get("/api/v1/students/{student_id}/matches")
def get_matches(student_id: str, account: Account = Depends(current_account)) -> list[dict[str, Any]]:
    if account.role != "admin" and account.id != student_id:
        raise HTTPException(403, "You can only view your own matches")
    with Session(engine) as db:
        recompute(db, student_id)
        db.commit()
        rows = db.scalars(select(Match).where(Match.student_id == student_id, Match.score >= 80)).all()
        return [
            {
                "opportunity": student_opportunity_view(opportunity.data) if account.role == "student" else opportunity.data,
                "score": row.score,
                "components": row.components,
                "reasons": row.reasons,
                "response": row.response,
            }
            for row in rows
            if (opportunity := db.get(OpportunityRecord, row.opportunity_id))
        ]


@app.get("/api/v1/students/{student_id}/applications")
def student_applications(student_id: str, account: Account = Depends(current_account)) -> list[dict[str, Any]]:
    if account.role != "student" or account.id != student_id:
        raise HTTPException(403, "You can only view your own applications")
    with Session(engine) as db:
        applications = db.scalars(select(StudentApplication).where(StudentApplication.student_id == student_id).order_by(StudentApplication.applied_at.desc())).all()
        result = []
        for application in applications:
            opportunity = db.get(OpportunityRecord, application.opportunity_id)
            result.append({
                "id": application.id,
                "opportunityId": application.opportunity_id,
                "title": opportunity.data.get("title", "") if opportunity else "Vacancy no longer available",
                "company": opportunity.data.get("company", "") if opportunity else "",
                "status": application.status,
                "note": application.note,
                "appliedAt": application.applied_at.isoformat(),
                "resumeShared": application.cv_share_consent,
                "applicationMode": opportunity.data.get("applicationMode", "internal") if opportunity else "internal",
            })
        return result


@app.post("/api/v1/applications/{opportunity_id}", status_code=201)
def create_student_application(opportunity_id: str, payload: StudentApplicationPayload, account: Account = Depends(require_role("student"))) -> dict[str, Any]:
    with Session(engine) as db:
        opportunity = db.get(OpportunityRecord, opportunity_id)
        if not opportunity or opportunity.status != "Approved":
            raise HTTPException(404, "Approved vacancy not found")
        application_mode = "external" if opportunity.data.get("applicationMode") == "external" else "internal"
        existing = db.scalar(select(StudentApplication).where(StudentApplication.student_id == account.id, StudentApplication.opportunity_id == opportunity_id))
        match = db.get(Match, f"{account.id}:{opportunity_id}")
        if match:
            match.response = None
        if existing:
            if application_mode == "external":
                db.commit()
                return {
                    "id": existing.id,
                    "opportunityId": opportunity_id,
                    "title": opportunity.data.get("title", ""),
                    "company": opportunity.data.get("company", ""),
                    "status": existing.status,
                    "note": existing.note,
                    "appliedAt": existing.applied_at.isoformat(),
                    "resumeShared": existing.cv_share_consent,
                    "applicationMode": application_mode,
                }
            raise HTTPException(409, "You have already applied to this vacancy")
        application = StudentApplication(
            id=str(uuid.uuid4()),
            student_id=account.id,
            opportunity_id=opportunity_id,
            status="External Application Started" if application_mode == "external" else "Submitted",
            note=(
                "External application website opened from APU NEXT; completion is not confirmed."
                if application_mode == "external"
                else payload.note.strip()
            ),
            cv_share_consent=payload.share_cv if application_mode == "internal" else False,
        )
        db.add(application)
        db.commit()
        return {
            "id": application.id,
            "opportunityId": opportunity_id,
            "title": opportunity.data.get("title", ""),
            "company": opportunity.data.get("company", ""),
            "status": application.status,
            "note": application.note,
            "appliedAt": application.applied_at.isoformat(),
            "resumeShared": application.cv_share_consent,
            "applicationMode": application_mode,
        }


@app.post("/api/v1/students/{student_id}/matches/{opportunity_id}/response")
def respond(student_id: str, opportunity_id: str, payload: ResponsePayload, account: Account = Depends(current_account)) -> dict[str, Any]:
    if account.role != "admin" and account.id != student_id:
        raise HTTPException(403, "You can only respond to your own matches")
    with Session(engine) as db:
        item = db.get(Match, f"{student_id}:{opportunity_id}")
        if not item or item.score < 80:
            raise HTTPException(404, "Strong match not found")
        item.response = payload.response
        db.commit()
        return {"saved": True, "response": item.response}


@app.get("/api/v1/admin/dashboard/stats")
def admin_dashboard_stats(account: Account = Depends(require_role("admin"))) -> dict[str, int]:
    with Session(engine) as db:
        student_count = db.scalar(select(func.count(Student.id))) or 0
        employer_count = db.scalar(
            select(func.count(Account.id)).where(Account.role == "employer")
        ) or 0
        vacancies = db.scalar(
            select(func.count(OpportunityRecord.id)).where(OpportunityRecord.status == "Approved")
        ) or 0
        return {
            "students": int(student_count),
            "employers": int(employer_count),
            "vacancies": int(vacancies),
        }
