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

The default local database is `backend/apu_next.db`. Its SQLite URL is `sqlite:///./apu_next.db`. The API stores account records, profiles, approved opportunity listings, match scores and explanations, student responses, and Career Guide request records. CV attachments are stored in `backend/uploads` for local development. When `AUTH_SECRET` is blank or unset, the backend generates a random key for that run; local sign-ins will need to be repeated after a backend restart. Set a private, stable random value in `backend/.env` for any shared or hosted deployment.

To connect Supabase PostgreSQL, create a Supabase project and copy its connection string from **Project Settings → Database** into `backend/.env` as `DATABASE_URL`. For SQLAlchemy, use the `postgresql+psycopg://` driver form and require SSL for remote connections. Keep `AUTH_SECRET` private and set a long random value; set a private `CAREER_STAFF_INVITE_CODE` for staff account creation. Do not put database credentials, the auth secret, or service keys into `VITE_*` variables or commit `.env` files. The optional Docker Compose PostgreSQL service requires a `POSTGRES_PASSWORD` environment variable and binds to localhost only.

The SQLAlchemy/Alembic schema is compatible with PostgreSQL and SQLite. Run `alembic -c alembic.ini upgrade head` after changing databases or applying schema changes. `UPLOAD_DIR` may be set to a persistent private file volume. Local uploaded CVs are not automatically copied to Supabase Storage; configure durable private object storage before hosting CV uploads online. Career Centre staff registration stays disabled until a private `CAREER_STAFF_INVITE_CODE` is configured.

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

CV review and mock interview requests are submitted to FastAPI and stored in SQL. Career Centre staff review them in the admin **Requests** page, grouped into clickable Mock interview and CV review sections. CV attachments are saved to the backend's private upload directory and can be viewed or downloaded by Career Centre staff from the CV review section. Staff can send the appropriate response email from each request: mock-interview emails include `MOCK_INTERVIEW_SCHEDULING_URL`, and CV-review emails use `CV_REVIEW_MESSAGE`. Event interest is intentionally handled only on the student's Career Guide page; after the student completes the form, the supplied QR image is shown immediately and the event is not sent to or listed in the Career Centre portal. Configure Gmail SMTP with an App Password in `backend/.env`; never use or commit a normal account password. Peer/professor mock interviews still open a prefilled `mailto:` message for the student's own mail client.

## APU NEXT AI assistant

The assistant uses a local BM25-style index to retrieve APU passages and local response templates to format grounded answers and practical general career guidance. It does not call an AI provider or perform live web searches. Official guidance is separated from general advice, and relevant document locations are shown with each answer.

The searchable index is generated locally at `backend/knowledge/assistant_corpus.json` from an authorized internship ZIP. The source archive and generated `backend/knowledge/` files are intentionally excluded from this public repository. To enable APU-specific retrieval locally, use documents you are authorized to process and run `python backend/scripts/build_knowledge.py "path/to/internship-documents.zip"`. PDF, DOCX, PPTX and text files are extracted locally; legacy DOC files use Microsoft Word automation on Windows. Without a local corpus, the assistant still answers general career questions and reports that it cannot verify APU-specific requirements. Some briefing deadlines may refer to past intakes, so check with the academic mentor or Career Centre for current deadlines and policy changes.

The assistant keeps up to eight recent chat turns in the browser request and does not persist chat history. Student-selected PDF, DOCX and TXT attachments up to 5 MB are extracted in memory and checked locally; APU NEXT does not save those assistant attachments. Scanned PDFs and image-only files are not text-extracted. General career guidance is rule-based and cannot verify current vacancies or produce open-ended language-model reviews.

## Programme catalogue and Careerjet discovery

The central programme catalogue and programme-specific search suggestions live in `backend/app/programmes.py`; the public `/api/v1/programmes` endpoint feeds student registration, profile editing, and Career Centre discovery. Existing recognised profile records are assigned a programme ID at startup without replacing their degree or major text. The initial catalogue uses programme names already present in APU NEXT alumni and student-profile data; entries are explicitly marked unverified and must be checked against APU's current official catalogue before production.

Career Centre staff use **Careerjet Discovery** to search with a programme, location, and optional suggested skills; import selected listings into the existing `opportunities` table; and review, publish, reject, archive, or recheck them. No second vacancy database is created. Only approved listings appear in the existing student **Internship Opportunities** feed, where internal source and review metadata are removed. Clicking an imported listing's application link records an **External Application Started** item in the student's **Applications** section before opening the original secure destination. APU NEXT cannot verify whether the student completes or submits the external form; repeated clicks open the destination again without creating duplicate records.

Add the publisher API key to `backend/.env` as `CAREERJET_API_KEY`; never put it in frontend environment files. Set `CAREERJET_PUBLISHER_URL` to the publisher website/page actually registered with Careerjet—not the account-management URL. Careerjet also requires a requester IP and browser user-agent. Local development may use `CAREERJET_USER_IP`; a public deployment should supply the real requester IP through a trusted reverse proxy. Restart FastAPI after changing backend environment variables.

If Careerjet returns `Unauthorized access from IP ...` (HTTP 403), it identifies an IP Careerjet rejected; it does not by itself prove that the IP is the backend's outbound address. Locally, verify `CAREERJET_USER_IP` is the current public IP of the person searching (not a LAN address). If it is correct and is still rejected, ask Careerjet whether that requester IP is authorized for the publisher API key. For other HTTP 403 responses, verify that the key is active and the Referer is the exact publisher page registered to that key.

The event-interest form is a student-side confirmation flow and does not reserve an official event place. The SD Guthrie confirmation panel shows the supplied date/time and Auditorium 5, Level 3, together with the QR image stored in `public/assets/event-qr.webp`.

Resume parsing accepts text-based PDF or DOCX and returns suggested fields for a student review step. It is heuristic extraction, so students must correct fields before saving; scanned PDFs and complex layouts can be missed. The uploaded CV used for parsing is not persisted by the profile parser.

## Before public hosting

- Create a Supabase project and use its PostgreSQL connection string.
- Configure a durable private file store for CVs instead of ephemeral app-server disk.
- Set unique random `AUTH_SECRET`, `CAREER_STAFF_INVITE_CODE`, and restrictive `CORS_ORIGINS` values.
- Configure and verify the Gmail SMTP sender before using staff email actions outside local testing.
- Use HTTPS and restrict hosting/database access. Current account creation has no email verification, password reset, rate limiting, or administrator approval workflow for employer accounts.
