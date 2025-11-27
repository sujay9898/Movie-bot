# Google Apps Script - Movie Bot Setup Guide

This guide will help you deploy your Telegram Movie Bot on Google Apps Script (free hosting!).

## Prerequisites

- Telegram account
- Google account
- 10 minutes of your time

---

## Step 1: Create Your Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Choose a display name (e.g., "Movie Bot")
4. Choose a username ending in `bot` (e.g., `my_movie_bot`)
5. **Save the API token** you receive (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

---

## Step 2: Create Google Spreadsheet (Database)

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "Movie Bot Database"
4. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit
   ```
   The ID is the long string between `/d/` and `/edit`

The bot will automatically create the "Movies" sheet with proper columns when first used.

---

## Step 3: Set Up Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Delete the default code in `Code.gs`
4. Copy all the code from `MovieBot.gs` file and paste it
5. **Update these values** at the top of the script:
   ```javascript
   const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';  // From BotFather
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';  // From Step 2
   ```
6. Click the **Save** icon (or Ctrl+S)
7. Name your project "Movie Bot"

---

## Step 4: Deploy the Web App

1. Click **Deploy** > **New deployment**
2. Click the gear icon next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: "Movie Bot v1"
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Authorize the app** when prompted (click through security warnings)
7. **Copy the Web App URL** (ends with `/exec`)

---

## Step 5: Connect Webhook

1. Go back to your script
2. Paste the Web App URL into the `WEB_APP_URL` variable:
   ```javascript
   const WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```
3. Save the file
4. Select `clearAndSetWebhook` from the function dropdown (top menu)
5. Click **Run**
6. Check the Execution log - should show `"ok":true` and `pending_update_count: 0`

---

## Step 6: Test Your Bot

1. Open Telegram
2. Search for your bot by username
3. Send `/start`
4. Your bot should respond with a welcome message!

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Bot doesn't respond | Run `getWebhookInfo()` to check webhook status |
| Bot spamming messages | Run `clearAndSetWebhook()` to clear pending updates |
| Authorization error | Make sure "Who has access" is set to "Anyone" |
| Spreadsheet error | Verify SPREADSHEET_ID is correct |
| Need to update code | Deploy > Manage deployments > Edit > New version |
| Multiple responses | Delete old deployments, keep only ONE active |

---

## Admin Setup

To allow yourself to add movies:

1. Send a message to @userinfobot on Telegram
2. Copy your Telegram User ID
3. Update the admin list in the script:
   ```javascript
   const ADMIN_IDS = ['YOUR_TELEGRAM_USER_ID'];
   ```

---

## Important Functions

| Function | Purpose |
|----------|---------|
| `clearAndSetWebhook` | **Use this to fix issues!** Clears pending messages and resets webhook |
| `setWebhook` | Set Telegram webhook to your script URL |
| `deleteWebhook` | Remove webhook (stop receiving messages) |
| `getWebhookInfo` | Check current webhook status |
| `testBot` | Test if bot token is working |

---

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start the bot |
| `/help` | Show help message |
| `/search movie` | Search for a movie |
| `/channels` | Show T4TSA channels |
| `/addmovie` | Add movie (admin only) |
| `/save Name \| Year \| Quality` | Save forwarded file |

---

## Adding Movies

### Method 1: Forward from Channels
1. Forward a movie file from @IrisMoviesX or @PhonoFilmBot to your bot
2. Bot will detect movie name, year, and quality
3. Send `/save Movie Name | Year | Quality` to confirm

### Method 2: Manual Add (Admin)
1. Get the file_id by forwarding the file to @RawDataBot
2. Use: `/add Movie Name | Year | Quality | FileID`

---

## Benefits of Google Apps Script

- **Free hosting** - runs on Google's servers
- **24/7 availability** - always online
- **Google Sheets database** - easy to view and edit
- **No server maintenance** - Google handles everything
- **Auto-scaling** - handles many users automatically
- **Deduplication** - prevents message spam automatically

---

## Updating Your Bot

When you modify the code:

1. Save the script
2. Go to **Deploy** > **Manage deployments**
3. Click the **pencil icon** (Edit)
4. Change **Version** to "New version"
5. Click **Deploy**
6. Run `clearAndSetWebhook` to apply changes
