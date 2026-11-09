# EduSpace Credential Rotation Runbook

Use this runbook during one planned maintenance window. Never revoke the old
credential before its replacement is installed and verified.

## Audit result

- No live Neon access-key, Neon secret-key, or database-password patterns were
  found in tracked Git history.
- Live values were found in two local ignored files:
  `DEPLOYMENT_SECRETS.txt` and `RENDER_ENV_COPY_PASTE.txt`.
- These files are now blocked by the repository-level `.gitignore`.
- CI scans all tracked history with Gitleaks on every push and pull request.
- Credentials previously copied into chats, screenshots, terminals, or setup
  documents must still be treated as exposed and rotated.

## Before starting

- Confirm production is healthy at `/health`.
- Keep Render, Neon, Mailjet, Vercel, and EduSpace admin sessions open.
- Record the current production Git SHA.
- Do not paste new secret values into chat, Git, screenshots, or issue trackers.
- Store replacements directly in the provider secret manager and Render.

## Rotation order

### 1. Neon object-storage credential

1. Create a new S3-compatible credential in Neon. Keep the old credential active.
2. In Render, replace all profile, document, and generic AWS access/secret values.
3. Confirm bucket names, endpoint, region, URLs, and path-style settings are unchanged.
4. Redeploy the latest backend commit.
5. Verify `/health` reports both storage checks as `ok`.
6. Upload/display/delete one test profile picture.
7. Upload/download/delete one private test document.
8. Revoke the old Neon storage credential.
9. Run `/health` again.

### 2. Neon database password

1. Rotate the application database role password in Neon.
2. Immediately replace Render's `DATABASE_URL` with the new pooled connection string.
3. Redeploy the latest backend commit.
4. Confirm `/health` reports the database as `ok`.
5. Verify admin login, dashboard counts, and one read/write/delete test record.
6. Remove obsolete connection strings from local files and password managers.

### 3. Mailjet SMTP credential

1. Generate a new Mailjet API/secret key pair while retaining the old pair.
2. Update Render `MAIL_USERNAME` and `MAIL_PASSWORD`.
3. Redeploy the backend.
4. Complete a password-reset email test.
5. Revoke the old Mailjet key pair.

### 4. Administrator password

1. Sign in to EduSpace as the production administrator.
2. Change the password to a unique password-manager-generated value.
3. Confirm all previous administrator tokens are revoked.
4. Store the new password only in the password manager.
5. Do not place it in `ADMIN_PASSWORD` after initial seeding; the seeder does not
   reset an existing administrator password.

### 5. Legacy providers

Revoke unused credentials for services that are no longer part of production,
including old Resend, Brevo, Cloudflare R2, Railway, or superseded storage keys.
Verify the current application does not reference them before revocation.

### 6. Laravel application key

Rotate `APP_KEY` only if the key itself was exposed outside trusted local/provider
secret stores. This invalidates encrypted cookies and may invalidate encrypted
application data.

If rotation is required:

1. Generate a new key locally with `php artisan key:generate --show`.
2. Schedule a logout window for all users.
3. Replace Render `APP_KEY` and redeploy.
4. Confirm login, password reset, notifications, and uploads.
5. Revoke all existing personal-access tokens as a precaution.

## Local cleanup

After all replacements are verified:

1. Move necessary recovery metadata into an encrypted password manager.
2. Securely delete `DEPLOYMENT_SECRETS.txt` and `RENDER_ENV_COPY_PASTE.txt`.
3. Clear terminal history and temporary files containing old values.
4. Confirm `git status --ignored` lists no unprotected secret file.
5. Run CI and the Production Smoke workflow.

## Completion checklist

- `[ ]` Neon storage credential rotated and old credential revoked
- `[ ]` Neon database password rotated
- `[ ]` Mailjet SMTP credential rotated and old credential revoked
- `[ ]` Production administrator password rotated
- `[ ]` Unused legacy-provider credentials revoked
- `[ ]` APP_KEY exposure assessed and rotation performed if required
- `[ ]` Local plaintext secret files securely removed
- `[ ]` `/health` reports all dependencies healthy
- `[ ]` Password-reset email passes
- `[ ]` Production Smoke workflow passes
