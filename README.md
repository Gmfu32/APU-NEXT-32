# APU NEXT

APU NEXT is a career workspace for students, Career Centre staff, and employers. The frontend is built with React, TypeScript, Vite, and Tailwind. The API is FastAPI with SQLAlchemy and Alembic, and it stores persistent records in SQLite locally or PostgreSQL (including Supabase-hosted PostgreSQL).

## Run locally

1. Start the FastAPI API and database using the steps in [DEVELOPMENT.md](DEVELOPMENT.md).
2. In a second terminal, run `npm install` and `npm run dev` from the project root.
3. Open the Vite URL and create an account. Career Centre staff accounts require the backend invite code.

## What is connected

- Account sign-up and sign-in with server-side password hashing.
- Student profile create/update and persisted match responses.
- Approved Career Centre listings and automatic NLP keyword fit scoring.
- Career Guide CV review, mock interview, and event-interest requests saved to the database.
- CV attachments stored on the API server during local development.

Matching compares normalized skills and profile text, then adds programme, location, and timing signals. The score explains relevance and does not predict hiring outcomes. Blank location or date fields contribute partial points instead of blocking every result.

## Configuration limits

The repository does not contain Supabase credentials, a mail provider, or an official event-registration form. Local SQLite works without an account. Use a Supabase project connection string to move the database online. Emails are not sent yet, and CV attachments need private durable file storage before public deployment. Read [DEVELOPMENT.md](DEVELOPMENT.md) before exposing the service to judges.
