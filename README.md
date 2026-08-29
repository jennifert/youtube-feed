# YouTube Feed

A local-first YouTube subscription feed built with Next.js, SQLite, and the YouTube Data API.

YouTube Feed retrieves recent uploads from your YouTube subscriptions, stores them in a local SQLite database, and provides a simple text-focused interface for viewing new videos.

The project is designed to keep the web interface separate from YouTube itself: the application reads from the local database rather than querying the YouTube API every time the page loads.

## Status

🚧 **Early development**

The initial project structure is currently being built. Features described below may not yet be implemented.

## Planned Features

- Authenticate with YouTube using OAuth 2.0
- Import subscribed YouTube channels
- Retrieve recent uploads
- Store channels and videos in SQLite
- Simple text-focused subscription feed
- Direct links to videos on YouTube
- Separate views for regular videos and Shorts
- Configurable Shorts behaviour
- Local settings
- Manual YouTube synchronization
- Optional scheduled synchronization
- Compact feed suitable for use by a status board

## How It Works

```text
YouTube Data API
       ↓
Node.js sync script
       ↓
SQLite database
       ↓
Next.js application
       ↓
Subscription feed / Status board
```

The YouTube API is used during synchronization. The application itself reads cached data from SQLite.

This allows the local feed to remain available even when a synchronization is not currently running.

## Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- JavaScript
- SQLite
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- OAuth 2.0

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
cp .env.example .env
```

Configure the required values in `.env`.

Example:

```env
YOUTUBE_API_KEY=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback
DATABASE_PATH=./data/youtube.db
```

**Do not commit your `.env` file, OAuth credentials, tokens, or personal SQLite database to Git.**

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

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

## Data and Privacy

YouTube Feed is intended to be local-first.

Your local database, OAuth credentials, authentication tokens, and subscription data should remain on your own system and are not intended to be included in the Git repository.

Anyone cloning the project should configure their own Google API credentials and generate their own local database.

## Development Roadmap

### MVP 1 — Project and Database

- Set up Next.js
- Configure SQLite
- Create the initial database schema
- Add environment configuration

### MVP 2 — YouTube Authentication and Sync

- Implement OAuth 2.0
- Retrieve subscriptions
- Retrieve recent uploads
- Add a manual Node.js synchronization command
- Store results in SQLite

### MVP 3 — Feed

- Display recent uploads from SQLite
- Sort newest first
- Display channel, video title, and publication date
- Link directly to YouTube

### MVP 4 — Videos and Shorts

- Identify Shorts where possible
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

Use `.env` for local secrets and `.env.example` to document the variables required by the application.

## License

See [LICENSE](LICENSE) for license information.