# Telegram Movie Bot

A Telegram bot that searches movies via TMDB API and provides download links from T4TSA website. Built entirely on Google Apps Script - no server required!

## Features

- Search movies by name or name + year
- TMDB integration for accurate movie data
- Movie posters and ratings display
- T4TSA download link integration
- Quality detection (720p/1080p)
- Caching for faster responses (1 hour)
- Google Sheets database support

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot and show welcome message |
| `/help` | Show help and usage instructions |
| `/search <movie>` | Search for a movie |
| `/channels` | Show T4TSA Telegram channels |

You can also just type a movie name directly (e.g., `Avatar 2009`)

## Setup Instructions

### 1. Get Required API Keys

1. **Telegram Bot Token**
   - Open Telegram and search for [@BotFather](https://t.me/BotFather)
   - Send `/newbot` and follow the instructions
   - Copy the bot token

2. **TMDB API Key**
   - Create an account at [themoviedb.org](https://www.themoviedb.org/)
   - Go to Settings > API > Request an API Key
   - Copy your API key (v3 auth)

3. **Google Sheet (Optional)**
   - Create a new Google Sheet for database
   - Copy the Sheet ID from the URL

### 2. Deploy to Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Copy the contents of `google-apps-script/Code.gs` into the script editor
4. Replace the configuration values at the top:
   ```javascript
   const BOT_TOKEN = 'YOUR_BOT_TOKEN';
   const WEB_APP_URL = 'YOUR_WEB_APP_URL';  // Update after first deploy
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
   const TMDB_API_KEY = 'YOUR_TMDB_API_KEY';
   ```

### 3. Deploy as Web App

1. Click **Deploy** > **New deployment**
2. Select type: **Web app**
3. Set:
   - Description: `Movie Bot v1.0`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Copy the Web app URL
6. Update `WEB_APP_URL` in your code with this URL
7. **Deploy again** (New deployment) with the updated URL

### 4. Set Up Webhook

1. In the script editor, select `clearAndSetWebhook` from the function dropdown
2. Click **Run**
3. Grant necessary permissions when prompted
4. Check the Execution log for success message

### 5. Test Your Bot

1. Open your bot in Telegram
2. Send `/start`
3. Try searching for a movie: `Avatar 2009`

## Project Structure

```
telegram-movie-bot/
├── google-apps-script/
│   └── Code.gs              # Main bot code for Google Apps Script
├── src/
│   └── index.js             # Node.js version (alternative)
├── README.md                # This file
└── replit.md                # Development notes
```

## How It Works

1. User sends a movie name to the bot
2. Bot searches TMDB API for matching movies
3. Results are displayed with poster, rating, and overview
4. User taps to get the T4TSA download page link
5. Bot checks T4TSA for available qualities (720p/1080p)

## Technical Details

- **Platform**: Google Apps Script (serverless, free)
- **APIs Used**: Telegram Bot API, TMDB API
- **Caching**: Google Apps Script CacheService (1 hour TTL)
- **Compatibility**: Uses string concatenation (no template literals) for GAS
- **Rate Limits**: 
  - TMDB: 40 requests/10 seconds
  - Google Apps Script: 20,000 URL fetches/day
  - 6-minute execution timeout per request

## T4TSA Channels

- [@IrisMoviesX](https://t.me/IrisMoviesX) - Latest movies
- [@SeriesBayX](https://t.me/SeriesBayX) - TV series
- [@PhonoFilmBot](https://t.me/PhonoFilmBot) - Request movies
- [t4tsa.cc](https://t4tsa.cc) - Website

## Troubleshooting

### Bot not responding to movie searches
1. Check execution logs: View > Executions in GAS
2. Make sure you deployed a **NEW version** after code changes
3. Run `clearAndSetWebhook` again

### Webhook errors
1. Verify `WEB_APP_URL` is correct and updated
2. Run `getWebhookInfo` to check current webhook status
3. Run `clearAndSetWebhook` to reset

### TMDB not finding movies
1. Check your API key is valid at TMDB website
2. Try adding the year: `Avatar 2009`
3. Check for typos in movie name

### Bot spamming messages
Run `clearAndSetWebhook` to clear pending updates.

## Updating the Bot

After making code changes:
1. Save the file (Ctrl+S)
2. Deploy > Manage deployments > Edit > New version > Deploy
3. Run `clearAndSetWebhook`
4. Test the bot

## Contributing

Feel free to submit issues and pull requests!

## License

MIT License

## Credits

- [TMDB](https://www.themoviedb.org/) - Movie database API
- [T4TSA](https://t4tsa.cc) - Movie download source
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Google Apps Script](https://developers.google.com/apps-script)
