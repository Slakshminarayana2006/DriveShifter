<div align="center">

# DriveShifter

**Move files and folders between Google Drive accounts, server-to-server, without downloading anything to your device.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://drive-shifter.vercel.app)
[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel)](https://drive-shifter.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-orange.svg)](./CONTRIBUTING.md)

[Live Demo](https://drive-shifter.vercel.app) · [Report a Bug](https://github.com/Slakshminarayana2006/DriveShifter/issues) · [Request a Feature](https://github.com/Slakshminarayana2006/DriveShifter/issues)

</div>

---

> **Note to maintainer:** Items marked `<!-- VERIFY -->` or written in `[brackets]` are placeholders. Replace them with the values from your actual codebase (stack versions, env variable names, endpoints) before publishing.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Google Cloud Setup](#google-cloud-setup)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Security & Privacy](#security--privacy)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

## Overview

Migrating data between Google Drive accounts (personal to work, old account to new, or student to personal) usually means downloading everything and re-uploading it, which is slow, bandwidth-heavy, and error-prone.

**DriveShifter** removes that step. You authorize a source and a destination account, pick what to move, and the transfer happens directly between Google's servers through the Drive API. Nothing is routed through your laptop or phone, so your internet speed and storage no longer limit the migration.

## Features

- **Server-to-server transfer**: files are copied between accounts using the Google Drive API, with no local download or re-upload.
- **Dual-account authentication**: sign in to both the source and destination accounts via Google OAuth 2.0.
- **Files and folders**: transfer individual files or whole folder trees, preserving hierarchy.
- **Native Google file support**: Docs, Sheets, and Slides are copied as native files rather than being exported and converted.
- **Progress tracking**: see live status for in-progress, completed, and failed items.
- **Responsive UI**: works on desktop and mobile browsers.
- **Minimal data retention**: no file contents are stored by the application. <!-- VERIFY -->

## How It Works

```
┌──────────────┐    1. Authorize     ┌───────────────────┐
│   Browser    │ ──────────────────► │  Google OAuth 2.0 │
│  (Frontend)  │ ◄────────────────── │  (Source + Dest)  │
└──────┬───────┘    2. Tokens        └───────────────────┘
       │
       │ 3. Transfer request (file/folder IDs)
       ▼
┌──────────────┐    4. Drive API     ┌───────────────────┐
│   Backend    │ ──────────────────► │  Google Drive API │
│  (REST API)  │   copy / create     │  Source ──► Dest  │
└──────────────┘                     └───────────────────┘
```

1. The user signs in to the **source** and **destination** Google accounts.
2. The frontend sends the selected file or folder IDs to the backend.
3. The backend calls the Drive API using each account's access token to read from the source and create or copy into the destination.
4. Status is reported back to the UI as items complete.

Because the data moves between Google's infrastructure, the client only sends small metadata requests.

## Tech Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Frontend   | `[React / Vite / Next.js]` <!-- VERIFY -->      |
| Backend    | `[Node.js / Express]` <!-- VERIFY -->           |
| Auth       | Google OAuth 2.0                                |
| Integration| Google Drive API v3                             |
| Hosting    | Vercel (frontend), `[Vercel / Render / other]` (backend) <!-- VERIFY --> |

## Project Structure

```
DriveShifter/
├── Backend/          # API server: OAuth handling and Drive transfer logic
└── Frontend/         # Web client: account linking, file selection, progress UI
```

## Getting Started

### Prerequisites

- **Node.js** `>= 18` and **npm** (or yarn/pnpm) <!-- VERIFY -->
- A **Google Cloud** project with the Drive API enabled
- Two Google accounts for testing (source and destination)
- **Git**

### Google Cloud Setup

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and create (or select) a project.
2. Go to **APIs & Services → Library** and enable the **Google Drive API**.
3. Go to **APIs & Services → OAuth consent screen**, configure it, and add the required scopes (see [Security & Privacy](#security--privacy)). Add your test users while the app is in *Testing* mode.
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID** and choose **Web application**.
5. Add **Authorized redirect URIs**:
   - Local: `http://localhost:[BACKEND_PORT]/auth/google/callback` <!-- VERIFY -->
   - Production: `https://[your-backend-domain]/auth/google/callback`
6. Save the **Client ID** and **Client Secret**.

### Installation

```bash
# Clone the repository
git clone https://github.com/Slakshminarayana2006/DriveShifter.git
cd DriveShifter

# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### Environment Variables

Create a `.env` file in each directory. **Never commit these files.**

**`Backend/.env`** <!-- VERIFY variable names -->

```env
PORT=5000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
SESSION_SECRET=a_long_random_string
FRONTEND_URL=http://localhost:5173
```

**`Frontend/.env`** <!-- VERIFY variable names -->

```env
VITE_API_URL=http://localhost:5000
```

| Variable               | Description                                         | Required |
| ---------------------- | --------------------------------------------------- | :------: |
| `GOOGLE_CLIENT_ID`     | OAuth client ID from Google Cloud                   |    ✅    |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret from Google Cloud               |    ✅    |
| `GOOGLE_REDIRECT_URI`  | OAuth callback URL registered in Google Cloud       |    ✅    |
| `SESSION_SECRET`       | Secret used to sign sessions/cookies                |    ✅    |
| `FRONTEND_URL`         | Allowed origin for CORS and post-login redirects    |    ✅    |
| `VITE_API_URL`         | Base URL of the backend used by the frontend        |    ✅    |

### Running Locally

Start the backend and frontend in separate terminals:

```bash
# Terminal 1: Backend
cd Backend
npm run dev        # or: npm start

# Terminal 2: Frontend
cd Frontend
npm run dev
```

Open the URL printed by the frontend dev server (typically `http://localhost:5173`).

## Usage

1. Open the app and click **Connect Source Account**. Sign in with the Google account that currently holds the files.
2. Click **Connect Destination Account** and sign in with the account that should receive them.
3. Browse the source Drive and select the files or folders to move.
4. Choose a destination folder (or the root of the destination Drive).
5. Click **Start Transfer** and monitor progress until all items complete.
6. Verify the files in the destination Drive.

> **Tip:** For large migrations, transfer in batches (for example, one top-level folder at a time) so any failures are easy to retry.

## API Reference

<!-- VERIFY: replace with the real routes from Backend -->

| Method | Endpoint                  | Description                                  |
| ------ | ------------------------- | -------------------------------------------- |
| `GET`  | `/auth/google`            | Start the OAuth flow (source or destination) |
| `GET`  | `/auth/google/callback`   | OAuth callback handler                       |
| `GET`  | `/api/files`              | List files and folders for a connected account |
| `POST` | `/api/transfer`           | Start a transfer between the two accounts    |
| `GET`  | `/api/transfer/:id`       | Get the status of a transfer                 |

## Deployment

The live app is hosted on Vercel: **[drive-shifter.vercel.app](https://drive-shifter.vercel.app)**.

### Frontend (Vercel)

1. Import the repository into [Vercel](https://vercel.com/new).
2. Set the **Root Directory** to `Frontend`.
3. Add the frontend environment variables in **Project Settings → Environment Variables**.
4. Deploy.

### Backend

1. Deploy the `Backend` directory to your host of choice (Vercel Serverless, Render, Railway, etc.).
2. Set all backend environment variables on the host.
3. Add the production callback URL to the **Authorized redirect URIs** in Google Cloud.
4. Update `FRONTEND_URL` to your production frontend domain and `VITE_API_URL` to your production backend domain.

### Production Checklist

- [ ] OAuth consent screen is published (or all users are added as test users)
- [ ] Redirect URIs match the deployed domains exactly
- [ ] `SESSION_SECRET` is a long, random value
- [ ] CORS is restricted to the production frontend origin
- [ ] HTTPS is enforced on all endpoints
- [ ] No secrets are committed to the repository

## Security & Privacy

- **Least privilege**: request only the scopes needed. Prefer `https://www.googleapis.com/auth/drive` only if full-Drive access is required; use narrower scopes where possible. <!-- VERIFY scopes -->
- **No content storage**: file contents are never stored by DriveShifter; transfers are performed through the Drive API.
- **Token handling**: access tokens are used only for the duration of the session/transfer and are not logged. <!-- VERIFY -->
- **Secrets**: credentials live in environment variables and are excluded from version control via `.gitignore`.
- **Revoking access**: you can revoke DriveShifter's access at any time at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

To report a vulnerability, please open a private security advisory under the repository's **Security** tab instead of a public issue.

## Troubleshooting

| Problem                                   | Likely cause / fix                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `redirect_uri_mismatch`                   | The redirect URI in Google Cloud doesn't exactly match `GOOGLE_REDIRECT_URI`.      |
| `Access blocked: app not verified`        | Add your account as a test user, or complete Google's app verification.            |
| `403: Drive API has not been used`        | Enable the Google Drive API in your Google Cloud project.                          |
| `403: storageQuotaExceeded`               | The destination account has insufficient storage.                                  |
| `403: rateLimitExceeded` / `429`          | API quota reached. Wait and retry, or transfer in smaller batches.                 |
| CORS errors in the browser                | `FRONTEND_URL` on the backend doesn't match the frontend's origin.                 |

## Roadmap

- [ ] Resumable and retryable transfers
- [ ] Transfer history and logs
- [ ] Duplicate detection and conflict handling
- [ ] Selective sync by file type or date
- [ ] Shared Drive support
- [ ] Automated tests and CI pipeline

## Contributing

Contributions are welcome and appreciated.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) and keep pull requests focused and well described.

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details. <!-- VERIFY: add a LICENSE file to the repo -->

## Author

**S. Lakshminarayana**
GitHub: [@Slakshminarayana2006](https://github.com/Slakshminarayana2006)

---

<div align="center">

If you find this project useful, please consider giving it a ⭐

</div>
