// ==========================================
// TELEGRAM MOVIE BOT - GOOGLE APPS SCRIPT
// ==========================================
// Configuration: Replace with your actual values
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; // Get from @BotFather
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
let WEB_APP_URL = ''; // Set after deployment

// Google Sheet Database (Create a sheet and get the ID from URL)
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Get from Google Sheets URL
const MOVIES_SHEET_NAME = 'Movies'; // Sheet tab name for movies

// T4TSA Channels (for forwarding)
const T4TSA_MOVIES_CHANNEL = '@IrisMoviesX';
const T4TSA_BOT = '@PhonoFilmBot';

// TMDB API (Free - get key from themoviedb.org)
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY'; // Optional: for movie info

// ==========================================
// WEBHOOK SETUP FUNCTIONS
// ==========================================

function setWebhook() {
  const url = `${TELEGRAM_API}/setWebhook?url=${WEB_APP_URL}`;
  const response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function deleteWebhook() {
  const url = `${TELEGRAM_API}/deleteWebhook`;
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

function forwardMessage(chatId, fromChatId, messageId) {
  const payload = {
    chat_id: chatId,
    from_chat_id: fromChatId,
    message_id: messageId
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(`${TELEGRAM_API}/forwardMessage`, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log('Error forwarding message: ' + error);
    return null;
  }
}

function sendPhoto(chatId, photoUrl, caption = '', replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    photo: photoUrl,
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
    UrlFetchApp.fetch(`${TELEGRAM_API}/sendPhoto`, options);
  } catch (error) {
    Logger.log('Error sending photo: ' + error);
    sendMessage(chatId, caption);
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

function getMoviesByName(movieName) {
  const sheet = getMoviesSheet();
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const results = [];
  const searchName = movieName.toLowerCase();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().toLowerCase().includes(searchName)) {
      results.push({
        name: data[i][0],
        year: data[i][1],
        quality: data[i][2],
        fileId: data[i][3],
        fileType: data[i][4],
        size: data[i][5]
      });
    }
  }
  
  return results;
}

// ==========================================
// TMDB FUNCTIONS (for movie info)
// ==========================================

function searchTMDB(query, year = null) {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
    return [];
  }
  
  try {
    let searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
    
    if (year) {
      searchUrl += `&year=${year}`;
    }
    
    const options = {
      method: 'get',
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(searchUrl, options);
    const data = JSON.parse(response.getContentText());
    
    return data.results || [];
  } catch (error) {
    Logger.log('TMDB search error: ' + error);
    return [];
  }
}

// ==========================================
// MESSAGE FORMATTING FUNCTIONS
// ==========================================

function formatSearchResults(movies, query) {
  if (!movies || movies.length === 0) {
    return `No movies found for "<b>${query}</b>"\n\nTry different keywords or check the spelling.`;
  }
  
  let message = `🎬 <b>Search Results for "${query}"</b>\n\n`;
  
  const grouped = {};
  movies.forEach(movie => {
    const key = `${movie.name} (${movie.year})`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(movie);
  });
  
  let index = 1;
  for (const [title, versions] of Object.entries(grouped)) {
    message += `${index}. <b>${title}</b>\n`;
    versions.forEach(v => {
      message += `   📁 ${v.quality} ${v.size ? `(${v.size})` : ''}\n`;
    });
    message += `   /get_${movies.indexOf(versions[0])}\n\n`;
    index++;
  }
  
  message += `<i>Tap on a command to download</i>`;
  
  return message;
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
• Add year for better results: "Inception 2010"
• I'll send you the movie file directly!

<b>Commands:</b>
/search movie name - Search for a movie
/help - Show help message
/channels - Show T4TSA channels
/addmovie - Add a movie to database (admin)

<b>Examples:</b>
• Inception
• The Dark Knight 2008
• Avatar 2009

Just type a movie name to get started! 🍿
  `;
  
  sendMessage(chatId, welcomeMessage);
}

function handleHelpCommand(chatId) {
  const helpMessage = `
🎬 <b>Movie Bot Help</b>

<b>Search Methods:</b>
1. <b>Simple search:</b> Just type the movie name
   Example: <code>Inception</code>

2. <b>Search with year:</b> Add the year for accurate results
   Example: <code>Avatar 2009</code>

<b>Commands:</b>
/start - Start the bot
/help - Show this help
/search name - Search for a movie
/channels - T4TSA Telegram channels
/addmovie - Add movie to database

<b>How it works:</b>
1. You send a movie name
2. Bot searches the database
3. You get the movie file directly!

<b>Don't see your movie?</b>
Check T4TSA channels or request via @PhonoFilmBot
  `;
  
  sendMessage(chatId, helpMessage);
}

function handleChannelsCommand(chatId) {
  const channelsMessage = `
📺 <b>T4TSA Telegram Channels</b>

<b>Main Channel:</b>
@T4TSA - Main announcements

<b>Movies:</b>
@IrisMoviesX - Latest movies

<b>TV Series:</b>
@SeriesBayX - TV shows & series

<b>Bot for Single Movies:</b>
@PhonoFilmBot - Request specific movies

<b>Asian Drama:</b>
@KDramasPack - Korean dramas

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
    sendMessage(chatId, '❌ Please provide a movie name.\n\nExample: /search Inception');
    return;
  }
  
  sendMessage(chatId, `🔍 Searching for "<b>${query}</b>"...`);
  
  const results = searchMovieInDatabase(query);
  
  if (results && results.length > 0) {
    const buttons = [];
    const uniqueMovies = {};
    
    results.slice(0, 10).forEach((movie, index) => {
      const key = `${movie.name}_${movie.year}`;
      if (!uniqueMovies[key]) {
        uniqueMovies[key] = [];
      }
      uniqueMovies[key].push(movie);
    });
    
    for (const [key, versions] of Object.entries(uniqueMovies)) {
      versions.forEach(movie => {
        buttons.push([{
          text: `📁 ${movie.name} (${movie.year}) - ${movie.quality}`,
          callback_data: `dl_${movie.row}`
        }]);
      });
    }
    
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
  const adminIds = ['YOUR_ADMIN_TELEGRAM_ID'];
  
  if (!adminIds.includes(userId.toString())) {
    sendMessage(chatId, '❌ Only admins can add movies.');
    return;
  }
  
  const message = `
📥 <b>Add Movie to Database</b>

To add a movie, forward a movie file from T4TSA channels to me.

Or send in this format:
<code>/add MovieName | Year | Quality | FileID</code>

Example:
<code>/add Inception | 2010 | 1080p | BQACAgIAAxk...</code>

<b>How to get File ID:</b>
1. Forward the movie file to @RawDataBot
2. Copy the file_id from the response
3. Use /add command with the file_id
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

<b>File ID saved!</b>
<code>${fileId}</code>

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

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==========================================
// MAIN HANDLERS
// ==========================================

function doPost(e) {
  try {
    const update = JSON.parse(e.postData.contents);
    
    if (update.message) {
      handleMessage(update.message);
    }
    
    if (update.callback_query) {
      handleCallbackQuery(update.callback_query);
    }
    
  } catch (error) {
    Logger.log('doPost error: ' + error);
  }
  
  return ContentService.createTextOutput('OK');
}

function handleMessage(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text || '';
  const userName = message.from.first_name || 'User';
  
  if (message.forward_from || message.forward_from_chat) {
    if (handleForwardedFile(message, chatId)) {
      return;
    }
  }
  
  if (message.document || message.video) {
    handleForwardedFile(message, chatId);
    return;
  }
  
  if (text.startsWith('/start')) {
    handleStartCommand(chatId, userName);
    return;
  }
  
  if (text.startsWith('/help')) {
    handleHelpCommand(chatId);
    return;
  }
  
  if (text.startsWith('/channels')) {
    handleChannelsCommand(chatId);
    return;
  }
  
  if (text.startsWith('/search ')) {
    const query = text.substring(8).trim();
    handleSearchCommand(chatId, query);
    return;
  }
  
  if (text.startsWith('/addmovie')) {
    handleAddMovie(chatId, userId);
    return;
  }
  
  if (text.startsWith('/save ')) {
    const args = text.substring(6).trim();
    handleSaveCommand(chatId, args);
    return;
  }
  
  if (text.startsWith('/get_')) {
    const index = parseInt(text.substring(5));
    handleDownload(chatId, index + 2);
    return;
  }
  
  if (text.startsWith('/')) {
    sendMessage(chatId, '❌ Unknown command. Type /help for available commands.');
    return;
  }
  
  if (text.trim().length > 0) {
    handleSearchCommand(chatId, text.trim());
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
      <head>
        <title>Movie Bot</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          h1 { color: #0088cc; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
          .status { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>🎬 Movie Bot</h1>
        <div class="status">
          <strong>Status:</strong> ✅ Bot is running!
        </div>
        <p>This is a Telegram bot for searching and downloading movies.</p>
        <h3>Available Commands:</h3>
        <ul>
          <li><code>/start</code> - Start the bot</li>
          <li><code>/help</code> - Show help message</li>
          <li><code>/search movie name</code> - Search for a movie</li>
          <li><code>/channels</code> - Show T4TSA channels</li>
          <li><code>/addmovie</code> - Add movie to database (admin)</li>
        </ul>
      </body>
    </html>
  `);
}

// ==========================================
// TEST FUNCTIONS
// ==========================================

function testBot() {
  const response = UrlFetchApp.fetch(`${TELEGRAM_API}/getMe`);
  Logger.log(response.getContentText());
}

function testSearch() {
  const results = searchMovieInDatabase('inception');
  Logger.log('Search results: ' + JSON.stringify(results));
}
