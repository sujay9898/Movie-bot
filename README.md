# Telegram Movie Bot

A Telegram bot for searching and downloading movies from a database. This bot can be deployed on **Google Apps Script** (free, serverless) or **Node.js** (Replit/VPS).

## Features

- Search movies by name or year
- Download movies directly in Telegram
- Forward movies from T4TSA channels to add to database
- Google Sheets as database (easy to manage)
- Admin controls for adding movies
- Inline keyboard buttons for easy navigation

## Deployment Options

### Option 1: Google Apps Script (Recommended - Free)

See [google-apps-script/SETUP_GUIDE.md](google-apps-script/SETUP_GUIDE.md) for detailed instructions.

**Quick Start:**
1. Go to [script.google.com](https://script.google.com)
2. Create new project
3. Copy code from `google-apps-script/MovieBot.gs`
4. Update configuration (BOT_TOKEN, SPREADSHEET_ID, WEB_APP_URL)
5. Deploy as Web App
6. Run `clearAndSetWebhook` function

### Option 2: Node.js (Replit/VPS)

**Requirements:**
- Node.js 18+
- npm

**Setup:**
```bash
npm install
```

**Environment Variables:**
```
BOT_TOKEN=your_bot_token_from_botfather
TMDB_API_KEY=optional_tmdb_key
ADMIN_IDS=comma_separated_admin_ids
```

**Run:**
```bash
npm start
```

## Project Structure

```
telegram-movie-bot/
├── google-apps-script/
│   ├── MovieBot.gs          # Complete Google Apps Script code
│   └── SETUP_GUIDE.md       # Detailed setup instructions
├── src/
│   └── index.js             # Node.js version
├── data/
│   ├── movies.json          # Local movie database (Node.js)
│   └── user_temp.json       # Temporary user data
├── package.json
└── README.md
```

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and instructions |
| `/help` | Show help and usage |
| `/search <movie>` | Search for a movie |
| `/channels` | Show T4TSA channels |
| `/addmovie` | Add movie to database (admin) |
| `/save` | Save forwarded file to database |

## Database

### Google Sheets (Google Apps Script)
- Create a Google Sheet with columns: `Movie Name`, `Year`, `Quality`, `File ID`, `File Type`, `Size`, `Added Date`
- Get the Spreadsheet ID from the URL
- Bot will auto-create the sheet if it doesn't exist

### JSON File (Node.js)
- Movies stored in `data/movies.json`
- Automatically created on first run

## T4TSA Channels

- [@IrisMoviesX](https://t.me/IrisMoviesX) - Latest movies
- [@PhonoFilmBot](https://t.me/PhonoFilmBot) - Request specific movies
- [@SeriesBayX](https://t.me/SeriesBayX) - TV series
- [t4tsa.cc](https://t4tsa.cc) - Website

## Configuration

### Google Apps Script
Edit the constants at the top of `MovieBot.gs`:
```javascript
const BOT_TOKEN = 'your_bot_token';
const SPREADSHEET_ID = 'your_spreadsheet_id';
const WEB_APP_URL = 'your_deployed_url';
const ADMIN_IDS = ['your_telegram_id'];
```

### Node.js
Set environment variables or edit `src/index.js`

## Troubleshooting

### Bot spamming messages
Run `clearAndSetWebhook` in Google Apps Script to clear pending updates.

### /start not working
1. Check BOT_TOKEN is correct
2. Verify WEB_APP_URL is the deployed script URL
3. Run `getWebhookInfo` to check webhook status

### File not sending
- Telegram file IDs are bot-specific
- Files must be forwarded through your bot first

## License

MIT License
