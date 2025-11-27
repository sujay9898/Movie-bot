# Telegram Movie Bot

## Overview
A Telegram bot for searching and downloading movies from T4TSA.cc. Runs on **Google Apps Script** (free, serverless, recommended).

## Project Structure
```
/
├── google-apps-script/
│   └── Code.gs              # Complete Google Apps Script code
├── src/
│   └── index.js             # Node.js version (alternative)
├── data/
│   └── movies.json          # Local movie database
├── README.md                # Setup instructions
├── replit.md                # This file
└── .gitignore               # Git ignore rules
```

## Configuration (Google Apps Script)
Replace these values in `google-apps-script/Code.gs`:

| Constant | Description | How to Get |
|----------|-------------|------------|
| `BOT_TOKEN` | Telegram Bot Token | @BotFather on Telegram |
| `WEB_APP_URL` | Deployed script URL | Deploy > New deployment |
| `TMDB_API_KEY` | TMDB API key | themoviedb.org/settings/api |
| `SPREADSHEET_ID` | Google Sheet ID | From sheet URL (optional) |

## Key Features
- TMDB API integration for movie search
- T4TSA.cc download link generation
- Quality detection (720p/1080p)
- Caching with CacheService (1 hour)
- Movie poster and rating display
- Year-aware search ("Avatar 2009")

## Bot Commands
| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/help` | Show help |
| `/search <movie>` | Search for a movie |
| `/channels` | Show T4TSA channels |

## Deployment Steps
1. Copy `Code.gs` to Google Apps Script
2. Update configuration constants
3. Deploy as Web App (anyone can access)
4. Copy deployed URL to `WEB_APP_URL`
5. Deploy again with updated URL
6. Run `clearAndSetWebhook` function

## Recent Changes
- 2025-11-27: Fixed movie search not responding bug
- 2025-11-27: Removed template literals for GAS compatibility
- 2025-11-27: Added comprehensive error handling
- 2025-11-27: Added T4TSA quality detection
- 2025-11-27: Integrated TMDB API for movie search

## Technical Notes
- Uses string concatenation (no template literals) for GAS compatibility
- CacheService for 1-hour caching
- Deduplication of webhook updates
- Error messages sent to user on failure
- JSDoc comments for all functions

## Troubleshooting
1. **Bot not responding to searches**: Deploy NEW version, run `clearAndSetWebhook`
2. **TMDB not finding movies**: Check API key, try adding year
3. **Webhook errors**: Run `getWebhookInfo` to debug

## User Preferences
- Bot runs on Google Apps Script only (not Replit)
- Uses string concatenation instead of template literals
- Prefers simple, clean code structure
