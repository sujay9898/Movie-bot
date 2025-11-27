# Telegram Movie Bot

## Overview
A Telegram bot for searching and downloading movies from T4TSA.cc. Supports both **Google Apps Script** (recommended, free) and **Node.js** deployments.

## Project Structure
```
/
├── google-apps-script/
│   ├── MovieBot.gs       # Complete Google Apps Script code
│   └── SETUP_GUIDE.md    # Setup instructions for GAS
├── src/
│   ├── index.js          # Node.js bot with T4TSA integration
│   ├── status.js         # Simple status page
│   └── t4tsa-scraper.js  # T4TSA.cc scraper module
├── data/
│   ├── movies.json       # Local movie database
│   └── user_temp.json    # Temporary user data
├── package.json          # Node.js dependencies
└── .gitignore            # Git ignore rules
```

## Environment Variables Required
| Variable | Description | Required |
|----------|-------------|----------|
| `BOT_TOKEN` | Telegram Bot Token from @BotFather | Yes |
| `TMDB_API_KEY` | TMDB API key for movie search | Yes (for T4TSA search) |
| `ADMIN_IDS` | Comma-separated Telegram user IDs | Optional |

## Key Features
- **T4TSA Integration**: Search movies on T4TSA.cc via TMDB
- **Quality Selection**: Choose between 720p and 1080p downloads
- **Movie search by name/year**: Add year for accurate results
- **Local database**: Store movies with Telegram file IDs
- **Admin controls**: Add movies to local database

## How It Works
1. User sends movie name (e.g., "Inception 2010")
2. Bot searches TMDB for the movie → gets TMDB ID
3. Bot fetches T4TSA.cc page using TMDB ID
4. Bot shows available 720p and 1080p file counts
5. User taps button to open T4TSA movie page and download

**Note**: T4TSA uses JavaScript to generate download links, so the bot directs users to the T4TSA website for actual downloads rather than extracting Telegram file links directly.

## Bot Commands
| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/help` | Show help |
| `/search <movie>` | Search for a movie |
| `/channels` | Show T4TSA channels |
| `/addmovie` | Add movie (admin) |
| `/save` | Save forwarded file |

## Recent Changes
- 2025-11-27: Added T4TSA.cc scraper integration
- 2025-11-27: Added 720p/1080p quality selection
- 2025-11-27: Integrated TMDB API for movie search
- 2025-11-27: Created t4tsa-scraper.js module

## Technology Stack
- Node.js/Express (main deployment)
- Cheerio (HTML parsing for scraping)
- Axios (HTTP requests)
- TMDB API (movie metadata)
- Telegram Bot API
- Google Apps Script (alternative)

## Troubleshooting
1. **Search not working**: Make sure TMDB_API_KEY is set
2. **Bot not responding**: Check BOT_TOKEN is correct
3. **No downloads found**: Movie may not be available on T4TSA
