// ==========================================
// TELEGRAM MOVIE BOT - GOOGLE APPS SCRIPT
// ==========================================

// CONFIGURATION - Replace these values with your own
const BOT_TOKEN = 'YOUR_BOT_TOKEN';  // Get from @BotFather
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const WEB_APP_URL = 'YOUR_WEB_APP_URL';  // Your deployed script URL

// Google Sheet Database
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const MOVIES_SHEET_NAME = 'Movies';

// T4TSA Channels
const T4TSA_MOVIES_CHANNEL = '@IrisMoviesX';
const T4TSA_BOT = '@PhonoFilmBot';

// TMDB API (Optional)
const TMDB_API_KEY = '';

// Admin IDs (your Telegram user ID)
const ADMIN_IDS = ['YOUR_TELEGRAM_USER_ID'];

// ==========================================
// WEBHOOK SETUP FUNCTIONS
// ==========================================

function clearAndSetWebhook() {
  Logger.log('=== CLEARING OLD WEBHOOKS AND PENDING MESSAGES ===');
  
  const infoUrl = `${TELEGRAM_API}/getWebhookInfo`;
  const currentInfo = UrlFetchApp.fetch(infoUrl);
  Logger.log('Current webhook: ' + currentInfo.getContentText());
  
  const deleteUrl = `${TELEGRAM_API}/deleteWebhook?drop_pending_updates=true`;
  const deleteResponse = UrlFetchApp.fetch(deleteUrl);
  Logger.log('Delete result: ' + deleteResponse.getContentText());
  
  Utilities.sleep(3000);
  
  if (WEB_APP_URL && WEB_APP_URL !== 'YOUR_WEB_APP_URL') {
    const setUrl = `${TELEGRAM_API}/setWebhook?url=${encodeURIComponent(WEB_APP_URL)}&drop_pending_updates=true`;
    const setResponse = UrlFetchApp.fetch(setUrl);
    Logger.log('Set webhook result: ' + setResponse.getContentText());
  } else {
    Logger.log('ERROR: Please set WEB_APP_URL before running this function!');
    return;
  }
  
  Utilities.sleep(2000);
  
  const verifyInfo = UrlFetchApp.fetch(infoUrl);
  Logger.log('New webhook info: ' + verifyInfo.getContentText());
  
  Logger.log('=== DONE! Send /start to your bot to test ===');
}

function setWebhook() {
  const url = `${TELEGRAM_API}/setWebhook?url=${encodeURIComponent(WEB_APP_URL)}&drop_pending_updates=true`;
  const response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function deleteWebhook() {
  const url = `${TELEGRAM_API}/deleteWebhook?drop_pending_updates=true`;
  const response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function getWebhookInfo() {
  const url = `${TELEGRAM_API}/getWebhookInfo`;
  const response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

// ==========================================
// TELEGRAM MESSAGE FUNCTIONS
// ==========================================

function sendMessage(chatId, text, parseMode = 'HTML', replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: parseMode,
    disable_web_page_preview: false
  };
  
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(`${TELEGRAM_API}/sendMessage`, options);
  } catch (error) {
    Logger.log('Error sending message: ' + error);
  }
}

function sendDocument(chatId, fileId, caption = '', replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    document: fileId,
    caption: caption,
    parse_mode: 'HTML'
  };
  
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(`${TELEGRAM_API}/sendDocument`, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log('Error sending document: ' + error);
    return null;
  }
}

function sendVideo(chatId, fileId, caption = '', replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    video: fileId,
    caption: caption,
    parse_mode: 'HTML',
    supports_streaming: true
  };
  
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(`${TELEGRAM_API}/sendVideo`, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log('Error sending video: ' + error);
    return null;
  }
}

function answerCallbackQuery(callbackQueryId, text = '') {
  const payload = {
    callback_query_id: callbackQueryId,
    text: text
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(`${TELEGRAM_API}/answerCallbackQuery`, options);
  } catch (error) {
    Logger.log('Error answering callback: ' + error);
  }
}

// ==========================================
// GOOGLE SHEET DATABASE FUNCTIONS
// ==========================================

function getMoviesSheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(MOVIES_SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(MOVIES_SHEET_NAME);
      sheet.appendRow(['Movie Name', 'Year', 'Quality', 'File ID', 'File Type', 'Size', 'Added Date']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    }
    
    return sheet;
  } catch (error) {
    Logger.log('Error getting sheet: ' + error);
    return null;
  }
}

function searchMovieInDatabase(query) {
  const sheet = getMoviesSheet();
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const results = [];
  const searchTerms = query.toLowerCase().split(' ');
  
  for (let i = 1; i < data.length; i++) {
    const movieName = data[i][0].toString().toLowerCase();
    const year = data[i][1].toString();
    
    let matchScore = 0;
    searchTerms.forEach(term => {
      if (movieName.includes(term) || year.includes(term)) {
        matchScore++;
      }
    });
    
    if (matchScore > 0) {
      results.push({
        name: data[i][0],
        year: data[i][1],
        quality: data[i][2],
        fileId: data[i][3],
        fileType: data[i][4],
        size: data[i][5],
        row: i + 1,
        score: matchScore
      });
    }
  }
  
  results.sort((a, b) => b.score - a.score);
  return results;
}

function addMovieToDatabase(movieName, year, quality, fileId, fileType, size) {
  const sheet = getMoviesSheet();
  if (!sheet) return false;
  
  sheet.appendRow([movieName, year, quality, fileId, fileType, size, new Date()]);
  return true;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function createInlineKeyboard(buttons) {
  return JSON.stringify({
    inline_keyboard: buttons
  });
}

// ==========================================
// COMMAND HANDLERS
// ==========================================

function handleStartCommand(chatId, userName) {
  const welcomeMessage = `
🎬 <b>Welcome to Movie Bot, ${userName}!</b>

I can help you find and download movies.

<b>How to use:</b>
• Just send me a movie name
• Add year for better results: "Avatar 2009"
• I'll send you the movie file directly!

<b>Commands:</b>
/search movie name - Search for a movie
/help - Show help message
/channels - Show T4TSA channels
/addmovie - Add a movie (admin)

Just type a movie name to get started!
  `;
  
  sendMessage(chatId, welcomeMessage);
}

function handleHelpCommand(chatId) {
  const helpMessage = `
🎬 <b>Movie Bot Help</b>

<b>Search Methods:</b>
1. <b>Simple search:</b> Just type the movie name
   Example: <code>Avatar</code>

2. <b>Search with year:</b> Add the year for accurate results
   Example: <code>Avatar 2009</code>

<b>Commands:</b>
/start - Start the bot
/help - Show this help
/search name - Search for a movie
/channels - T4TSA Telegram channels
/addmovie - Add movie to database

<b>Don't see your movie?</b>
Check T4TSA channels or request via @PhonoFilmBot
  `;
  
  sendMessage(chatId, helpMessage);
}

function handleChannelsCommand(chatId) {
  const channelsMessage = `
📺 <b>T4TSA Telegram Channels</b>

<b>Movies:</b>
@IrisMoviesX - Latest movies

<b>Bot for Single Movies:</b>
@PhonoFilmBot - Request specific movies

<b>TV Series:</b>
@SeriesBayX - TV shows & series

<b>Community:</b>
@FlicksChat - Chat & requests

<b>Website:</b>
https://t4tsa.cc

<i>Forward movie files from these channels to me, and I'll save them to the database!</i>
  `;
  
  sendMessage(chatId, channelsMessage);
}

function handleSearchCommand(chatId, query) {
  if (!query || query.trim() === '') {
    sendMessage(chatId, '❌ Please provide a movie name.\n\nExample: /search Avatar');
    return;
  }
  
  sendMessage(chatId, `🔍 Searching for "<b>${query}</b>"...`);
  
  const results = searchMovieInDatabase(query);
  
  if (results && results.length > 0) {
    const buttons = [];
    
    results.slice(0, 10).forEach(movie => {
      buttons.push([{
        text: `📁 ${movie.name} (${movie.year}) - ${movie.quality}`,
        callback_data: `dl_${movie.row}`
      }]);
    });
    
    let message = `🎬 <b>Found ${results.length} result(s) for "${query}"</b>\n\n`;
    message += `<i>Tap a button below to download:</i>`;
    
    sendMessage(chatId, message, 'HTML', createInlineKeyboard(buttons));
  } else {
    let message = `❌ No results found for "<b>${query}</b>" in database.\n\n`;
    message += `<b>Options:</b>\n`;
    message += `1. Try different spelling\n`;
    message += `2. Search in T4TSA channels:\n`;
    message += `   @IrisMoviesX\n`;
    message += `   @PhonoFilmBot\n\n`;
    message += `<i>Forward movie files from those channels to me, and I'll add them!</i>`;
    
    const buttons = [[
      { text: '🔍 Search on T4TSA', url: `https://t4tsa.cc/search?q=${encodeURIComponent(query)}` }
    ]];
    
    sendMessage(chatId, message, 'HTML', createInlineKeyboard(buttons));
  }
}

function handleDownload(chatId, rowNumber) {
  const sheet = getMoviesSheet();
  if (!sheet) {
    sendMessage(chatId, '❌ Database error. Please try again later.');
    return;
  }
  
  try {
    const row = sheet.getRange(rowNumber, 1, 1, 6).getValues()[0];
    const movieName = row[0];
    const year = row[1];
    const quality = row[2];
    const fileId = row[3];
    const fileType = row[4];
    const size = row[5];
    
    if (!fileId) {
      sendMessage(chatId, '❌ File not found in database.');
      return;
    }
    
    const caption = `🎬 <b>${movieName}</b> (${year})\n📊 Quality: ${quality}\n📁 Size: ${size || 'Unknown'}`;
    
    sendMessage(chatId, `⏳ Sending <b>${movieName}</b>...`);
    
    if (fileType === 'video') {
      sendVideo(chatId, fileId, caption);
    } else {
      sendDocument(chatId, fileId, caption);
    }
    
  } catch (error) {
    Logger.log('Download error: ' + error);
    sendMessage(chatId, '❌ Error sending file. Please try again.');
  }
}

function handleAddMovie(chatId, userId) {
  if (ADMIN_IDS.length > 0 && ADMIN_IDS[0] !== 'YOUR_TELEGRAM_USER_ID') {
    if (!ADMIN_IDS.includes(userId.toString())) {
      sendMessage(chatId, '❌ Only admins can add movies.');
      return;
    }
  }
  
  const message = `
📥 <b>Add Movie to Database</b>

To add a movie, forward a movie file from T4TSA channels to me.

Or send in this format:
<code>/save Movie Name | Year | Quality</code>

Example:
<code>/save Avatar | 2009 | 1080p</code>
  `;
  
  sendMessage(chatId, message);
}

function handleForwardedFile(message, chatId) {
  if (message.document || message.video) {
    const file = message.document || message.video;
    const fileId = file.file_id;
    const fileName = file.file_name || 'Unknown';
    const fileSize = file.file_size ? formatFileSize(file.file_size) : 'Unknown';
    const fileType = message.video ? 'video' : 'document';
    
    const nameMatch = fileName.match(/(.+?)[\.\s]*(19|20\d{2})/);
    let movieName = fileName.replace(/\.[^/.]+$/, '').replace(/[\._]/g, ' ');
    let year = '';
    
    if (nameMatch) {
      movieName = nameMatch[1].replace(/[\._]/g, ' ').trim();
      year = nameMatch[2];
    }
    
    const qualityMatch = fileName.match(/(480p|720p|1080p|2160p|4K|HDRip|BluRay|WEB-DL|WEBRip)/i);
    const quality = qualityMatch ? qualityMatch[1] : 'Unknown';
    
    const confirmMessage = `
📁 <b>File Received!</b>

<b>Detected Info:</b>
🎬 Name: ${movieName}
📅 Year: ${year || 'Unknown'}
📊 Quality: ${quality}
📁 Size: ${fileSize}

Reply with movie details to save:
<code>/save ${movieName} | ${year} | ${quality}</code>

Or edit and send:
<code>/save Movie Name | Year | Quality</code>
    `;
    
    PropertiesService.getUserProperties().setProperty('lastFileId_' + chatId, fileId);
    PropertiesService.getUserProperties().setProperty('lastFileType_' + chatId, fileType);
    PropertiesService.getUserProperties().setProperty('lastFileSize_' + chatId, fileSize);
    
    sendMessage(chatId, confirmMessage);
    return true;
  }
  
  return false;
}

function handleSaveCommand(chatId, args) {
  const parts = args.split('|').map(p => p.trim());
  
  if (parts.length < 3) {
    sendMessage(chatId, '❌ Invalid format.\n\nUse: /save Movie Name | Year | Quality');
    return;
  }
  
  const movieName = parts[0];
  const year = parts[1];
  const quality = parts[2];
  
  const fileId = PropertiesService.getUserProperties().getProperty('lastFileId_' + chatId);
  const fileType = PropertiesService.getUserProperties().getProperty('lastFileType_' + chatId);
  const fileSize = PropertiesService.getUserProperties().getProperty('lastFileSize_' + chatId);
  
  if (!fileId) {
    sendMessage(chatId, '❌ No file found. Please forward a movie file first.');
    return;
  }
  
  const success = addMovieToDatabase(movieName, year, quality, fileId, fileType, fileSize);
  
  if (success) {
    PropertiesService.getUserProperties().deleteProperty('lastFileId_' + chatId);
    PropertiesService.getUserProperties().deleteProperty('lastFileType_' + chatId);
    PropertiesService.getUserProperties().deleteProperty('lastFileSize_' + chatId);
    
    sendMessage(chatId, `✅ <b>Movie saved!</b>\n\n🎬 ${movieName} (${year})\n📊 Quality: ${quality}\n\nUsers can now search and download this movie!`);
  } else {
    sendMessage(chatId, '❌ Error saving movie. Please try again.');
  }
}

// ==========================================
// MAIN HANDLERS
// ==========================================

function doPost(e) {
  try {
    const update = JSON.parse(e.postData.contents);
    const updateId = update.update_id;
    
    const cache = CacheService.getScriptCache();
    const cacheKey = 'processed_' + updateId;
    
    if (cache.get(cacheKey)) {
      return ContentService.createTextOutput(JSON.stringify({ok: true}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    cache.put(cacheKey, 'true', 600);
    
    if (update.message) {
      handleMessage(update.message);
    }
    
    if (update.callback_query) {
      handleCallbackQuery(update.callback_query);
    }
    
  } catch (error) {
    Logger.log('doPost error: ' + error);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ok: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleMessage(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = (message.text || '').trim();
  const userName = message.from.first_name || 'User';
  
  Logger.log('Received: "' + text + '" from ' + chatId);
  
  if (message.forward_from || message.forward_from_chat) {
    if (handleForwardedFile(message, chatId)) {
      return;
    }
  }
  
  if (message.document || message.video) {
    handleForwardedFile(message, chatId);
    return;
  }
  
  const command = text.toLowerCase().split('@')[0];
  
  if (command === '/start' || text.toLowerCase().startsWith('/start ')) {
    handleStartCommand(chatId, userName);
    return;
  }
  
  if (command === '/help' || text.toLowerCase().startsWith('/help ')) {
    handleHelpCommand(chatId);
    return;
  }
  
  if (command === '/channels' || text.toLowerCase().startsWith('/channels ')) {
    handleChannelsCommand(chatId);
    return;
  }
  
  if (text.toLowerCase().startsWith('/search ')) {
    const query = text.substring(8).trim();
    handleSearchCommand(chatId, query);
    return;
  }
  
  if (command === '/addmovie' || text.toLowerCase().startsWith('/addmovie ')) {
    handleAddMovie(chatId, userId);
    return;
  }
  
  if (text.toLowerCase().startsWith('/save ')) {
    const args = text.substring(6).trim();
    handleSaveCommand(chatId, args);
    return;
  }
  
  if (text.toLowerCase().startsWith('/get_')) {
    const index = parseInt(text.substring(5));
    handleDownload(chatId, index + 2);
    return;
  }
  
  if (text.startsWith('/')) {
    sendMessage(chatId, '❌ Unknown command. Type /help for available commands.');
    return;
  }
  
  if (text.length > 0) {
    handleSearchCommand(chatId, text);
  }
}

function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const queryId = callbackQuery.id;
  
  answerCallbackQuery(queryId);
  
  if (data.startsWith('dl_')) {
    const rowNumber = parseInt(data.substring(3));
    handleDownload(chatId, rowNumber);
    return;
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput(`
    <html>
      <head><title>Movie Bot</title></head>
      <body style="font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h1>Movie Bot</h1>
        <div style="background: #d4edda; padding: 15px; border-radius: 5px;">
          <strong>Status:</strong> Bot is running!
        </div>
        <h3>Commands:</h3>
        <ul>
          <li>/start - Start the bot</li>
          <li>/search movie - Search for a movie</li>
          <li>/channels - Show T4TSA channels</li>
        </ul>
      </body>
    </html>
  `);
}

function testBot() {
  const response = UrlFetchApp.fetch(`${TELEGRAM_API}/getMe`);
  Logger.log(response.getContentText());
}
