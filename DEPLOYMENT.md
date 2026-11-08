# EduSpace deployment

The prepared free-tier architecture is:

- **Frontend:** Vercel Hobby (`front/`)
- **API:** Render Free Web Service (`backend/Dockerfile`)
- **Database:** Neon Free Postgres
- **Files:** two Cloudflare R2 buckets
  - a public bucket for profile pictures
  - a private bucket for protected documents
- **Transactional email:** Brevo Free SMTP on port 2525

This is appropriate for a personal/educational deployment. Render Free sleeps
after 15 minutes without traffic, so the first API request after an idle period
can take about one minute. Upgrade the API service before treating the project
as an always-available production service.

## 1. Prepare secrets

Generate the Laravel key locally and copy the complete output:

```bash
php artisan key:generate --show
```

Generate a unique administrator password of at least 12 characters containing
upper- and lowercase letters, numbers, and symbols. Never commit either value.

## 2. Neon

1. Create a free Neon project in a European region.
2. Copy its pooled Postgres connection string.
3. Use the complete string as Render's `DATABASE_URL` secret.

## 3. Cloudflare R2

Create two Standard-storage buckets:

1. `eduspace-profiles`: enable public access and copy its public URL.
2. `eduspace-documents`: keep public access disabled.

Create an R2 S3 API token that can read and write both buckets. Record the
access-key ID, secret, account endpoint, and both bucket names. The endpoint is
usually `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

## 4. Render API

1. In Render, create a Blueprint from this repository's `render.yaml`.
2. Supply every value marked `sync: false`.
3. Set `APP_KEY` to the complete `base64:...` value generated earlier.
4. Initially set `FRONTEND_URL` to the expected Vercel production URL. Update
   it if Vercel assigns a different URL.
5. Use the R2 values for both sets of S3 credentials. Set
   `PROFILE_AWS_URL` to the public profile bucket URL.
6. Create a Brevo SMTP key and provide its login, key, and a verified sender
   address. Render Free blocks common SMTP ports but allows Brevo's port 2525.
7. Wait for `/` on the generated `onrender.com` URL to return:
   `{"application":"EduSpace","status":"ok"}`.

The container automatically runs non-destructive migrations, idempotent role
and administrator seeding, Laravel optimization, and then the API server.

## 5. Vercel frontend

1. Import the same repository into Vercel.
2. Set the project root directory to `front`.
3. Set `NEXT_PUBLIC_API_URL` to the Render API URL without a trailing slash.
4. Set `NEXT_PUBLIC_STORAGE_URL` to the public R2 profile bucket URL.
5. Deploy and copy the final production URL.
6. Update Render's `FRONTEND_URL` to that exact origin and redeploy the API.

## 6. Verification

After deployment:

1. Open the API root and confirm its health response.
2. Log in using the initial administrator account.
3. Change the administrator password immediately.
4. Create one room and one equipment item.
5. Register a teacher and submit a reservation.
6. Upload and download a test document.
7. Upload a profile picture.
8. Request a password-reset email and complete the reset flow.
9. Confirm an unauthenticated request to `/api/users` returns HTTP 401.

## Required production variables

See `backend/.env.example`, `render.yaml`, and `front/.env.example`. In
production, always keep `APP_DEBUG=false`, use HTTPS origins, and never commit
database, administrator, mail, or R2 credentials.
