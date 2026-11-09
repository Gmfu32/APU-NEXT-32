# APU NEXT development setup

APU NEXT uses React + TypeScript + Vite in the browser and a FastAPI backend with SQLAlchemy and PostgreSQL-compatible database storage. Local setup defaults to SQLite so the application can be run before a hosted Supabase project exists. When Supabase is ready, set the backend `DATABASE_URL` to its PostgreSQL connection string; credentials must remain in backend environment variables.

## Start the API and local database

Use Python 3.11 or newer. From the `backend` directory:

```powershell
Copy-Item .env.example .env
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic -c alembic.ini upgrade head
uvicorn app.main:app --reload --port 8000
```

The default local database is `backend/apu_next.db`. Its SQLite URL is `sqlite:///./apu_next.db`. The API stores account records, profiles, approved opportunity listings, match scores and explanations, student responses, and Career Guide request records. CV attachments are stored in `backend/uploads` for local development.

To connect Supabase PostgreSQL, create a Supabase project and copy its connection string from **Project Settings → Database** into `backend/.env` as `DATABASE_URL`. For SQLAlchemy, use the `postgresql+psycopg://` driver form and require SSL for remote connections. Keep `AUTH_SECRET` private and set a long random value; set a private `CAREER_STAFF_INVITE_CODE` for staff account creation. Do not put database credentials, the auth secret, or service keys into `VITE_*` variables or commit `.env` files.

The SQLAlchemy/Alembic schema is compatible with PostgreSQL and SQLite. Run `alembic -c alembic.ini upgrade head` after changing databases or applying schema changes. `UPLOAD_DIR` may be set to a persistent private file volume. Local uploaded CVs are not automatically copied to Supabase Storage; configure durable private object storage before hosting CV uploads online.

## Start the frontend

From the project root:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

The frontend expects the API at `http://localhost:8000/api/v1`. `VITE_API_BASE_URL` may be changed in `.env.local` when the API is hosted elsewhere. Keep `VITE_USE_MOCK_DATA=false` so account, profile, listing, match response, and Career Guide requests use the API.

## Accounts and matching

Sign-up creates an account in the database. Passwords are salted and hashed on the server; the browser receives a short-lived signed bearer token. Career Centre staff registration requires the private invite code configured in the backend. Account roles must still be administered carefully before public deployment.

Matching is deterministic NLP-style keyword matching: it normalizes common skill aliases and compares listing requirements to profile skills, interests, projects, work experience, and bio. Programme, location, and placement dates contribute to the score and reasons without silently rejecting a listing just because one field was left blank. A score is a relevance signal, not a probability of being hired. Each listing is checked again when a profile or listing changes; multiple students may match one listing.

## Career Guide requests

CV review, mock interview, and event-interest requests are submitted to FastAPI and stored in SQL. CV attachments are saved to the backend's private upload directory. To email requests, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `EMAIL_FROM` in `backend/.env`; for Gmail, set the sender username/from address to an account you control and use its Google App Password (with 2-step verification enabled). Career Centre requests go to `CAREER_CENTER_EMAIL` (set to the inbox provided for this project). For peer/professor mock interviews, the student must enter the recipient name and email. Career Centre staff requests go to the Centre inbox. Messages use the student's account address as Reply-To; email cannot safely be sent as the student without access to their mailbox. Match notification emails are sent to the account email when an approved listing first reaches 80% for that student. The destination URL uses `APP_BASE_URL`.

The event-interest form saves a request and sends it to the Career Centre when SMTP is configured. It does not reserve an official event place. The SD Guthrie confirmation panel shows the supplied date/time and Auditorium 5, Level 3; the event QR image is not included until provided by the organizer.

Resume parsing accepts text-based PDF or DOCX and returns suggested fields for a student review step. It is heuristic extraction, so students must correct fields before saving; scanned PDFs and complex layouts can be missed. The uploaded CV used for parsing is not persisted by the profile parser.

## Before public hosting

- Create a Supabase project and use its PostgreSQL connection string.
- Configure a durable private file store for CVs instead of ephemeral app-server disk.
- Set unique random `AUTH_SECRET`, `CAREER_STAFF_INVITE_CODE`, and restrictive `CORS_ORIGINS` values.
- Add an email service and verified recipient before promising email notifications.
- Use HTTPS and restrict hosting/database access. Current account creation has no email verification, password reset, rate limiting, or administrator approval workflow for employer accounts.
