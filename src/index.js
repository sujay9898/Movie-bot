import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').filter(Boolean);

const T4TSA_MOVIES_CHANNEL = '@IrisMoviesX';
const T4TSA_BOT = '@PhonoFilmBot';

const DATA_FILE = path.join(__dirname, '..', 'data', 'movies.json');
const USER_DATA_FILE = path.join(__dirname, '..', 'data', 'user_temp.json');

function loadMovies() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading movies:', error);
  }
  return [];
}

function saveMovies(movies) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving movies:', error);
    return false;
  }
}

function loadUserData() {
  try {
    if (fs.existsSync(USER_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(USER_DATA_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
  return {};
}

function saveUserData(data) {
  try {
    fs.mkdirSync(path.dirname(USER_DATA_FILE), { recursive: true });
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

async function sendMessage(chatId, text, parseMode = 'HTML', replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: parseMode,
    disable_web_page_preview: false
  };
  
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }
  
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function sendDocument(chatId, fileId, caption = '', replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    document: fileId,
    caption: caption,
    parse_mode: 'HTML'
  };
  
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }
  
  try {
    const response = await fetch(`${TELEGRAM_API}/sendDocument`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending document:', error);
    return null;
  }
}

async function sendVideo(chatId, fileId, caption = '', replyMarkup = null) {
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
  
  try {
    const response = await fetch(`${TELEGRAM_API}/sendVideo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending video:', error);
    return null;
  }
}

async function answerCallbackQuery(callbackQueryId, text = '') {
  const payload = {
    callback_query_id: callbackQueryId,
    text: text
  };
  
  try {
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Error answering callback:', error);
  }
}

function searchMovieInDatabase(query) {
  const movies = loadMovies();
  const results = [];
  const searchTerms = query.toLowerCase().split(' ');
  
  movies.forEach((movie, index) => {
    const movieName = movie.name.toLowerCase();
    const year = movie.year.toString();
    
    let matchScore = 0;
    searchTerms.forEach(term => {
      if (movieName.includes(term) || year.includes(term)) {
        matchScore++;
      }
    });
    
    if (matchScore > 0) {
      results.push({
        ...movie,
        index: index,
        score: matchScore
      });
    }
  });
  
  results.sort((a, b) => b.score - a.score);
  return results;
}

function addMovieToDatabase(movieName, year, quality, fileId, fileType, size) {
  const movies = loadMovies();
  movies.push({
    name: movieName,
    year: year,
    quality: quality,
    fileId: fileId,
    fileType: fileType,
    size: size,
    addedDate: new Date().toISOString()
  });
  return saveMovies(movies);
}

function createInlineKeyboard(buttons) {
  return { inline_keyboard: buttons };
}

async function handleStartCommand(chatId, userName) {
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
  
  await sendMessage(chatId, welcomeMessage);
}

async function handleHelpCommand(chatId) {
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
  
  await sendMessage(chatId, helpMessage);
}

async function handleChannelsCommand(chatId) {
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
  
  await sendMessage(chatId, channelsMessage);
}

async function handleSearchCommand(chatId, query) {
  if (!query || query.trim() === '') {
    await sendMessage(chatId, '❌ Please provide a movie name.\n\nExample: /search Inception');
    return;
  }
  
  await sendMessage(chatId, `🔍 Searching for "<b>${query}</b>"...`);
  
  const results = searchMovieInDatabase(query);
  
  if (results && results.length > 0) {
    const buttons = [];
    const uniqueMovies = {};
    
    results.slice(0, 10).forEach((movie) => {
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
          callback_data: `dl_${movie.index}`
        }]);
      });
    }
    
    let message = `🎬 <b>Found ${results.length} result(s) for "${query}"</b>\n\n`;
    message += `<i>Tap a button below to download:</i>`;
    
    await sendMessage(chatId, message, 'HTML', createInlineKeyboard(buttons));
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
    
    await sendMessage(chatId, message, 'HTML', createInlineKeyboard(buttons));
  }
}

async function handleDownload(chatId, movieIndex) {
  const movies = loadMovies();
  
  if (movieIndex < 0 || movieIndex >= movies.length) {
    await sendMessage(chatId, '❌ Movie not found in database.');
    return;
  }
  
  try {
    const movie = movies[movieIndex];
    const caption = `🎬 <b>${movie.name}</b> (${movie.year})\n📊 Quality: ${movie.quality}\n📁 Size: ${movie.size || 'Unknown'}`;
    
    await sendMessage(chatId, `⏳ Sending <b>${movie.name}</b>...`);
    
    if (movie.fileType === 'video') {
      await sendVideo(chatId, movie.fileId, caption);
    } else {
      await sendDocument(chatId, movie.fileId, caption);
    }
  } catch (error) {
    console.error('Download error:', error);
    await sendMessage(chatId, '❌ Error sending file. Please try again.');
  }
}

async function handleAddMovie(chatId, userId) {
  if (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(userId.toString())) {
    await sendMessage(chatId, '❌ Only admins can add movies.');
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
  
  await sendMessage(chatId, message);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function handleForwardedFile(message, chatId) {
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
    
    const userData = loadUserData();
    userData[chatId] = {
      fileId: fileId,
      fileType: fileType,
      fileSize: fileSize
    };
    saveUserData(userData);
    
    await sendMessage(chatId, confirmMessage);
    return true;
  }
  
  return false;
}

async function handleSaveCommand(chatId, args) {
  const parts = args.split('|').map(p => p.trim());
  
  if (parts.length < 3) {
    await sendMessage(chatId, '❌ Invalid format.\n\nUse: /save Movie Name | Year | Quality');
    return;
  }
  
  const movieName = parts[0];
  const year = parts[1];
  const quality = parts[2];
  
  const userData = loadUserData();
  const userFile = userData[chatId];
  
  if (!userFile || !userFile.fileId) {
    await sendMessage(chatId, '❌ No file found. Please forward a movie file first.');
    return;
  }
  
  const success = addMovieToDatabase(movieName, year, quality, userFile.fileId, userFile.fileType, userFile.fileSize);
  
  if (success) {
    delete userData[chatId];
    saveUserData(userData);
    
    await sendMessage(chatId, `✅ <b>Movie saved!</b>\n\n🎬 ${movieName} (${year})\n📊 Quality: ${quality}\n\nUsers can now search and download this movie!`);
  } else {
    await sendMessage(chatId, '❌ Error saving movie. Please try again.');
  }
}

async function handleAddCommand(chatId, userId, args) {
  if (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(userId.toString())) {
    await sendMessage(chatId, '❌ Only admins can add movies.');
    return;
  }
  
  const parts = args.split('|').map(p => p.trim());
  
  if (parts.length < 4) {
    await sendMessage(chatId, '❌ Invalid format.\n\nUse: /add Movie Name | Year | Quality | FileID\n\nExample:\n<code>/add Inception | 2010 | 1080p | BQACAgIAAxk...</code>');
    return;
  }
  
  const movieName = parts[0];
  const year = parts[1];
  const quality = parts[2];
  const fileId = parts[3];
  
  const success = addMovieToDatabase(movieName, year, quality, fileId, 'document', 'Unknown');
  
  if (success) {
    await sendMessage(chatId, `✅ <b>Movie added!</b>\n\n🎬 ${movieName} (${year})\n📊 Quality: ${quality}\n\nUsers can now search and download this movie!`);
  } else {
    await sendMessage(chatId, '❌ Error adding movie. Please try again.');
  }
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text || '';
  const userName = message.from.first_name || 'User';
  
  if (message.forward_from || message.forward_from_chat) {
    if (await handleForwardedFile(message, chatId)) {
      return;
    }
  }
  
  if (message.document || message.video) {
    await handleForwardedFile(message, chatId);
    return;
  }
  
  if (text.startsWith('/start')) {
    await handleStartCommand(chatId, userName);
    return;
  }
  
  if (text.startsWith('/help')) {
    await handleHelpCommand(chatId);
    return;
  }
  
  if (text.startsWith('/channels')) {
    await handleChannelsCommand(chatId);
    return;
  }
  
  if (text.startsWith('/search ')) {
    const query = text.substring(8).trim();
    await handleSearchCommand(chatId, query);
    return;
  }
  
  if (text.startsWith('/addmovie')) {
    await handleAddMovie(chatId, userId);
    return;
  }
  
  if (text.startsWith('/save ')) {
    const args = text.substring(6).trim();
    await handleSaveCommand(chatId, args);
    return;
  }
  
  if (text.startsWith('/add ')) {
    const args = text.substring(5).trim();
    await handleAddCommand(chatId, userId, args);
    return;
  }
  
  if (text.startsWith('/get_')) {
    const index = parseInt(text.substring(5));
    await handleDownload(chatId, index);
    return;
  }
  
  if (text.startsWith('/')) {
    await sendMessage(chatId, '❌ Unknown command. Type /help for available commands.');
    return;
  }
  
  if (text.trim().length > 0) {
    await handleSearchCommand(chatId, text.trim());
  }
}

async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const queryId = callbackQuery.id;
  
  await answerCallbackQuery(queryId);
  
  if (data.startsWith('dl_')) {
    const movieIndex = parseInt(data.substring(3));
    await handleDownload(chatId, movieIndex);
    return;
  }
}

app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    
    if (update.message) {
      await handleMessage(update.message);
    }
    
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }
  } catch (error) {
    console.error('Webhook error:', error);
  }
  
  res.status(200).send('OK');
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Movie Bot</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          h1 { color: #0088cc; margin-bottom: 20px; }
          p { color: #666; line-height: 1.6; }
          .status { 
            background: ${BOT_TOKEN ? '#d4edda' : '#f8d7da'}; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0;
            color: ${BOT_TOKEN ? '#155724' : '#721c24'};
          }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
          .commands { background: #f8f9fa; padding: 15px; border-radius: 8px; }
          .commands h3 { margin-top: 0; color: #333; }
          .commands ul { margin: 0; padding-left: 20px; }
          .commands li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎬 Movie Bot</h1>
          <p>A Telegram bot for searching and downloading movies.</p>
          
          <div class="status">
            <strong>Status:</strong> ${BOT_TOKEN ? '✅ Bot token configured' : '❌ BOT_TOKEN not set'}
          </div>
          
          <div class="commands">
            <h3>Available Commands:</h3>
            <ul>
              <li><code>/start</code> - Start the bot</li>
              <li><code>/help</code> - Show help message</li>
              <li><code>/search movie</code> - Search for a movie</li>
              <li><code>/channels</code> - Show T4TSA channels</li>
              <li><code>/addmovie</code> - Add movie to database (admin)</li>
            </ul>
          </div>
          
          <p style="margin-top: 20px; font-size: 14px; color: #888;">
            Webhook endpoint: <code>/webhook</code>
          </p>
        </div>
      </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Movie Bot server running on port ${PORT}`);
  console.log(`Bot token configured: ${BOT_TOKEN ? 'Yes' : 'No'}`);
});
