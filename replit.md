# Telegram Movie Bot

## Overview
A Telegram bot for searching and downloading movies. Supports both **Google Apps Script** (recommended, free) and **Node.js** deployments.

## Project Structure
```
/
├── google-apps-script/
│   ├── MovieBot.gs       # Complete Google Apps Script code (MAIN)
│   └── SETUP_GUIDE.md    # Setup instructions for GAS
├── src/
│   └── index.js          # Node.js version (alternative)
├── data/
│   ├── movies.json       # Movie database (Node.js version)
│   └── user_temp.json    # Temporary user data
├── README.md             # Main documentation
├── package.json          # Node.js dependencies
└── .gitignore            # Git ignore rules
```

## Current Deployment
**Primary:** Google Apps Script (free, serverless)
- Bot Token: Set in Google Apps Script
- Database: Google Sheets (ID: 1oi0ts8bW6FClMiPRkie3mJt_zk5MJ7wVSwDr4T_1XKg)
- Webhook: Configured via `clearAndSetWebhook` function

## Key Features
- Movie search by name/year
- Direct file downloads in Telegram
- Google Sheets as database
- Deduplication to prevent message spam
- Admin controls for adding movies
- T4TSA channel integration

## Bot Commands
| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/help` | Show help |
| `/search <movie>` | Search for a movie |
| `/channels` | Show T4TSA channels |
| `/addmovie` | Add movie (admin) |
| `/save` | Save forwarded file |

## Google Apps Script Functions
| Function | Purpose |
|----------|---------|
| `clearAndSetWebhook` | Fix spamming, reset webhook |
| `setWebhook` | Set Telegram webhook |
| `deleteWebhook` | Remove webhook |
| `getWebhookInfo` | Check webhook status |
| `testBot` | Test bot connection |

## Recent Changes
- 2025-11-27: Added deduplication in `doPost` to prevent message spam
- 2025-11-27: Fixed webhook response format (JSON with proper MIME type)
- 2025-11-27: Added `clearAndSetWebhook` function with `drop_pending_updates`
- 2025-11-27: Improved command detection (case-insensitive, handles @botname suffix)

## Troubleshooting
1. **Bot spamming messages**: Run `clearAndSetWebhook` in Google Apps Script
2. **Commands not working**: Check BOT_TOKEN and WEB_APP_URL are correct
3. **Multiple deployments**: Delete old deployments in GAS, keep only one

## Technology Stack
- Google Apps Script (primary)
- Google Sheets (database)
- Telegram Bot API
- Node.js/Express (alternative deployment)
