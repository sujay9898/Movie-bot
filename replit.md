# Telegram Movie Bot

## Overview
A Telegram bot for searching and downloading movies. Converted from Google Apps Script to Node.js for Replit deployment.

## Project Structure
```
/
├── src/
│   └── index.js      # Main bot server (Express + Telegram API)
├── data/
│   ├── movies.json   # Movie database (JSON file storage)
│   └── user_temp.json # Temporary user data for file uploads
├── package.json      # Node.js dependencies
└── .gitignore        # Git ignore rules
```

## Environment Variables Required
- `BOT_TOKEN` - Telegram Bot Token (get from @BotFather on Telegram)
- `ADMIN_IDS` - Comma-separated list of Telegram user IDs for admin access (optional)
- `TMDB_API_KEY` - TMDB API key for movie info (optional)

## How It Works
1. The bot receives messages via webhook at `/webhook`
2. Users can search for movies by typing the name
3. Movies are stored in `data/movies.json`
4. Admins can add movies by forwarding files from Telegram channels

## Bot Commands
- `/start` - Start the bot
- `/help` - Show help message
- `/search <movie>` - Search for a movie
- `/channels` - Show T4TSA channels
- `/addmovie` - Add movie to database (admin only)
- `/save` - Save forwarded movie file to database

## Webhook Setup
After deployment, set the webhook in Telegram:
```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<YOUR_REPLIT_URL>/webhook
```

## Recent Changes
- 2024: Converted from Google Apps Script to Node.js
- Uses file-based JSON storage instead of Google Sheets
- Express server on port 5000 with webhook endpoint

## Technology Stack
- Node.js 20
- Express.js for HTTP server
- node-fetch for Telegram API calls
- JSON file storage for movie database
