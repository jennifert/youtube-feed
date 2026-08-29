# YouTube Feed

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ESM-yellow?logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Pico CSS](https://img.shields.io/badge/Pico_CSS-v2-0E7490)](https://picocss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-local--first-003B57?logo=sqlite)](https://sqlite.org/)
[![YouTube Data API](https://img.shields.io/badge/YouTube-Data_API_v3-red?logo=youtube)](https://developers.google.com/youtube/v3)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Release](https://img.shields.io/github/v/release/jennifert/youtube-feed?include_prereleases&label=release)](https://github.com/jennifert/youtube-feed/releases)

A local-first YouTube subscription feed built with Next.js, SQLite, and the YouTube Data API.

YouTube Feed authenticates with YouTube, retrieves subscribed channels and recent uploads, stores them in a local SQLite database, and provides a simple text-focused interface for viewing new videos.

The project is designed to keep the web interface separate from YouTube itself: synchronization happens independently, and the application reads from the local database rather than querying the YouTube API every time the page loads.

## Status

🚧 **Early development**

The database, YouTube OAuth flow, subscription import, recent-upload synchronization, and manual sync command are working.

The next development stage is building the Next.js feed UI from the local SQLite database.

## Current Features

- YouTube OAuth 2.0 authentication
- Import subscribed YouTube channels
- Subscription pagination
- Retrieve recent uploads from subscribed channels
- Store channels and videos in SQLite
- Manual YouTube synchronization
- Duplicate-safe channel and video updates
- Local-first database architecture

## Planned Features

- Simple text-focused subscription feed
- Direct links to videos on YouTube
- Separate views for regular videos and Shorts
- Configurable Shorts behaviour
- Local settings
- Optional scheduled synchronization
- Compact feed suitable for use by a status board

## How It Works

```text
YouTube Data API
       ↓
OAuth + Node.js sync script
       ↓
SQLite database
       ↓
Next.js application
       ↓
Subscription feed / Status board
```

The YouTube API is used only during synchronization.

The Next.js application reads cached channel and video information from SQLite. This keeps page rendering independent from YouTube API availability and avoids making API requests whenever the feed is opened.

## Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- JavaScript
- SQLite
- better-sqlite3
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- OAuth 2.0
- googleapis

## Requirements

Before running the project, you will need:

- Node.js
- npm
- A Google Cloud project
- YouTube Data API v3 enabled
- OAuth 2.0 credentials for a Web application

## Getting Started

Clone the repository and install the dependencies:

```bash
git clone https://github.com/jennifert/youtube-feed.git
cd youtube-feed
npm install
```

Create your local environment file:

```bash
cp .env.example .env.local
```

Configure the required values in `.env.local`.

Example:

```env
YOUTUBE_API_KEY=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback
DATABASE_PATH=./data/youtube.db
```

**Do not commit your `.env.local` file, OAuth credentials, tokens, or personal SQLite database to Git.**

Initialize the local database:

```bash
npm run db:init
```

Apply any available migrations:

```bash
npm run db:migrate
```

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

Authorize the application with YouTube:

```text
http://localhost:3000/api/auth/youtube
```

After authorization, run the manual synchronization:

```bash
npm run sync
```

The synchronization command imports your subscribed channels and recent uploads into the local SQLite database.

## Environment Variables

| Variable | Description |
| --- | --- |
| `YOUTUBE_API_KEY` | API key for the YouTube Data API |
| `YOUTUBE_CLIENT_ID` | OAuth 2.0 client ID |
| `YOUTUBE_CLIENT_SECRET` | OAuth 2.0 client secret |
| `YOUTUBE_REDIRECT_URI` | OAuth callback URL |
| `DATABASE_PATH` | Location of the local SQLite database |

An `.env.example` file is included as a template.

Never place real credentials in `.env.example`.

## Database

The application uses a local SQLite database.

Current data includes:

- OAuth tokens
- Subscribed YouTube channels
- Recent videos

The current database structure is documented in:

```text
database/schema.sql
```

Database changes for existing installations are stored in:

```text
database/migrations/
```

The local SQLite database is intentionally excluded from Git.

Anyone cloning the project can create their own database using the included schema and migrations.

## Synchronization

YouTube synchronization currently runs manually:

```bash
npm run sync
```

The synchronization process:

```text
Load saved OAuth credentials
        ↓
Retrieve all YouTube subscriptions
        ↓
Store/update subscribed channels
        ↓
Find each channel's uploads playlist
        ↓
Retrieve recent uploads
        ↓
Store/update videos in SQLite
```

Channel and video records use upserts so repeated synchronization does not create duplicate entries.

Automatic scheduled synchronization is planned for a later MVP.

## Data and Privacy

YouTube Feed is intended to be local-first.

Your local database, OAuth credentials, authentication tokens, and subscription data remain on your own system and are not intended to be included in the Git repository.

Anyone cloning the project should configure their own Google API credentials, authorize their own YouTube account, and generate their own local database.

## Development Roadmap

### MVP 1 — Project and Database ✅

- Set up Next.js
- Configure SQLite
- Create the initial database schema
- Add environment configuration
- Add database migrations

### MVP 2 — YouTube Authentication and Sync ✅

- Implement OAuth 2.0
- Store OAuth credentials locally
- Retrieve subscriptions
- Support subscription pagination
- Retrieve recent uploads
- Add a manual Node.js synchronization command
- Store results in SQLite
- Prevent duplicate channel and video records

### MVP 3 — Feed ✅

- Display recent uploads from SQLite
- Sort newest first
- Display channel, video title, and publication date
- Link directly to YouTube

### MVP 4 — Videos and Shorts ✅

- Identify likely Shorts using available API data
- Add All, Videos, and Shorts views
- Add configurable Shorts behaviour

### MVP 5 — Settings

- Add a settings page
- Configure feed size
- Configure default view
- Configure Shorts behaviour

### MVP 6 — Feed Polish

- Relative publication times
- Pagination or load-more support
- Channel links
- Empty and error states
- Last synchronization information
- Responsive layout

### MVP 7 — Scheduled Sync

- Add optional scheduled synchronization
- Document cron/systemd configuration
- Keep manual synchronization available

### MVP 8 — Status Board Integration

- Provide a compact recent-video feed
- Read from the same SQLite database
- Link to the full feed and original YouTube videos

### MVP 9 — Public Release

- Finalize setup documentation
- Add changelog
- Review configuration and privacy documentation
- Ensure personal databases and credentials cannot be committed

## Security

OAuth client secrets, API keys, access tokens, refresh tokens, and local databases must not be committed to the repository.

Use `.env.local` for local secrets and `.env.example` to document the variables required by the application.

## License

See [LICENSE](LICENSE) for license information.
