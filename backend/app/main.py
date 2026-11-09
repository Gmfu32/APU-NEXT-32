"""APU NEXT API: account access, student profiles, opportunity matching and requests."""
import base64
import calendar
import hashlib
import hmac
import json
import os
import smtplib
import re
import secrets
import ssl
import uuid
from email.message import EmailMessage
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import Boolean, DateTime, Integer, JSON, String, Text, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./apu_next.db")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
engine_options: dict[str, Any] = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, **engine_options)
AUTH_SECRET = os.getenv("AUTH_SECRET", "local-development-secret-change-before-deployment")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads")).resolve()


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
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Student(Base):
    __tablename__ = "students"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    data: Mapped[dict[str, Any]] = mapped_column(JSON)
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


class ProfilePayload(BaseModel):
    profile: dict[str, Any]


class OpportunityPayload(BaseModel):
    opportunity: dict[str, Any]


class OpportunityDecisionPayload(BaseModel):
    decision: str = Field(pattern="^(approve|reject)$")


class ResponsePayload(BaseModel):
    response: str = Field(pattern="^(interested|passed)$")


class AuthPayload(BaseModel):
    email: str
    password: str = Field(min_length=8)
    name: str | None = None
    role: str | None = None
    staff_code: str | None = None


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
    claims = {"sub": account.id, "exp": int((datetime.now(timezone.utc) + timedelta(hours=12)).timestamp())}
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
        db.expunge(account)
        return account


def require_role(*roles: str):
    def check(account: Account = Depends(current_account)) -> Account:
        if account.role not in roles:
            raise HTTPException(403, "Your account cannot perform this action")
        return account
    return check


def account_result(account: Account) -> dict[str, Any]:
    return {"token": issue_token(account), "user": {"id": account.id, "name": account.name, "email": account.email, "role": account.role, "subtitle": {"student": "Student", "admin": "Career Centre", "employer": "Employer"}[account.role], "initials": "".join(part[0] for part in account.name.split()[:2]).upper(), "verifiedEmail": False}}


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


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    with engine.connect() as connection:
        connection.exec_driver_sql("SELECT 1")
    return {"status": "ok", "database": "connected"}


@app.post("/api/v1/auth/register", status_code=201)
def register(payload: AuthPayload) -> dict[str, Any]:
    role = payload.role or "student"
    if role not in {"student", "employer", "admin"}:
        raise HTTPException(422, "Choose a valid account type")
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
        account = Account(id=str(uuid.uuid4()), name=(payload.name or "").strip(), email=email, role=role, password_salt=salt.hex(), password_hash=hashlib.pbkdf2_hmac("sha256", payload.password.encode(), salt, 310_000).hex())
        if not account.name:
            raise HTTPException(422, "Enter your name")
        db.add(account)
        if role == "student":
            profile = {"name": account.name, "studentId": account.id, "email": account.email, "degree": "", "major": "", "yearOfStudy": "", "graduationStatus": "", "cgpa": "", "bio": "", "skills": [], "careerInterests": [], "preferredIndustries": [], "preferredLocations": [], "internshipAvailability": "", "internshipStartDate": "", "internshipEndDate": "", "openToMatches": True, "cvFileName": None, "cvUpdatedDate": None, "projects": [], "certifications": [], "education": [], "workExperience": []}
            db.add(Student(id=account.id, data=profile))
        db.commit()
        db.refresh(account)
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
        return account_result(account)


@app.get("/api/v1/students/{student_id}/profile")
def get_profile(student_id: str, account: Account = Depends(current_account)) -> dict[str, Any]:
    if account.role != "admin" and (account.role != "student" or account.id != student_id):
        raise HTTPException(403, "You can only view your own student profile")
    with Session(engine) as db:
        item = db.get(Student, student_id)
        if not item:
            raise HTTPException(404, "Student profile not found")
        return item.data


@app.put("/api/v1/students/{student_id}/profile")
def save_profile(student_id: str, payload: ProfilePayload, account: Account = Depends(current_account)) -> dict[str, Any]:
    if account.role != "admin" and (account.role != "student" or account.id != student_id):
        raise HTTPException(403, "You can only update your own student profile")
    with Session(engine) as db:
        item = db.get(Student, student_id)
        data = dict(payload.profile)
        if account.role == "student":
            data.update({"studentId": account.id, "name": account.name, "email": account.email})
        if item:
            item.data = data
        else:
            item = Student(id=student_id, data=data)
            db.add(item)
        db.flush()
        recompute(db, student_id)
        for match in db.scalars(select(Match).where(Match.student_id == student_id, Match.score >= 80)).all():
            opportunity = db.get(OpportunityRecord, match.opportunity_id)
            if opportunity and opportunity.status == "Approved":
                notify_student_match(db, student_id, opportunity.data, match.score)
        db.commit()
        return {"profile": item.data, "matchesUpdated": True}


@app.post("/api/v1/students/{student_id}/cv/parse")
async def parse_cv(student_id: str, file: UploadFile = File(...), account: Account = Depends(current_account)) -> dict[str, Any]:
    if account.role != "student" or account.id != student_id:
        raise HTTPException(403, "CV parsing is available to the signed-in student")
    if file.size and file.size > 5_000_000:
        raise HTTPException(413, "CV must be 5 MB or smaller")
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
    parsed = parse_resume_profile(text, student_id, account.name, account.email)
    return {"fileName": file.filename, "proposedProfile": parsed, "requiresStudentConfirmation": True, "notes": ["Text-based extraction can miss or misclassify resume details. Review every field before saving."]}


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
            date_text = re.search(r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?\s+)?20\d{2}\s*(?:-|–|to|—)\s*(?:Present|Current|(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?\s+)?20\d{2})", joined, re.I)
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
    request = CareerRequest(id=str(uuid.uuid4()), student_id=account.id, request_type=request_type,
        data={"name": name.strip(), "email": account.email, "programme": programme.strip(), "details": details.strip(), "interviewerType": interviewer_type, "interviewerName": interviewer_name.strip(), "preferredTime": preferred_time.strip()},
        uploaded_file_name=upload.filename if upload else None, uploaded_file_path=stored_path)
    try:
        with Session(engine) as db:
            db.add(request)
            db.commit()
    except Exception:
        if stored_path:
            Path(stored_path).unlink(missing_ok=True)
        raise
    recipient = os.getenv("CAREER_CENTER_EMAIL", "")
    reply_to = account.email
    target = recipient
    subject_label = {"cv_review": "CV review", "mock_interview": "Mock interview", "event_interest": "Event interest"}[request_type]
    if request_type == "mock_interview" and interviewer_type in {"Student peer", "Professor"}:
        target = interviewer_email.strip()
        subject_label = f"Mock interview request for {interviewer_name.strip() or interviewer_type}"
    status = send_email(target, f"APU NEXT Request | {subject_label}", f"Request from {account.name} ({account.email})\nProgramme: {programme.strip()}\nType: {request_type}\nDetails: {details.strip()}\nPreferred time: {preferred_time.strip()}", reply_to=reply_to, attachment_path=stored_path) if target else "not_configured"
    with Session(engine) as db:
        saved = db.get(CareerRequest, request.id)
        saved.data = {**saved.data, "emailStatus": status, "emailRecipient": target}
        db.commit()
    return {"id": request.id, "requestType": request_type, "createdAt": request.created_at.isoformat(), "status": "received", "emailStatus": status}


@app.get("/api/v1/career-guidance/requests")
def list_career_requests(account: Account = Depends(require_role("student"))) -> list[dict[str, Any]]:
    with Session(engine) as db:
        rows = db.scalars(select(CareerRequest).where(CareerRequest.student_id == account.id).order_by(CareerRequest.created_at.desc())).all()
        return [{"id": row.id, "requestType": row.request_type, "data": row.data, "fileName": row.uploaded_file_name, "createdAt": row.created_at.isoformat(), "status": "received"} for row in rows]


@app.get("/api/v1/opportunities")
def list_opportunities(status: str = "Approved", account: Account = Depends(current_account)) -> list[dict[str, Any]]:
    if status != "Approved" and account.role != "admin":
        raise HTTPException(403, "Only Career Centre staff can view unpublished opportunities")
    with Session(engine) as db:
        return [item.data for item in db.scalars(select(OpportunityRecord).where(OpportunityRecord.status == status)).all()]


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


@app.get("/api/v1/admin/opportunities/pending")
def pending_employer_opportunities(account: Account = Depends(require_role("admin"))) -> list[dict[str, Any]]:
    with Session(engine) as db:
        return [item.data for item in db.scalars(select(OpportunityRecord).where(OpportunityRecord.status == "Pending Review")).all()]


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
        return [{"opportunity": db.get(OpportunityRecord, row.opportunity_id).data, "score": row.score, "components": row.components, "reasons": row.reasons, "response": row.response} for row in rows if db.get(OpportunityRecord, row.opportunity_id)]


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
