// ==========================================
// TELEGRAM MOVIE BOT - GOOGLE APPS SCRIPT
// WITH T4TSA SCRAPING
// ==========================================

// CONFIGURATION - Replace these values with your own
const BOT_TOKEN = 'YOUR_BOT_TOKEN';  // Get from @BotFather
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const WEB_APP_URL = 'YOUR_WEB_APP_URL';  // Your deployed script URL

// Google Sheet Database
const SPREADSHEET_ID = '1oi0ts8bW6FClMiPRkie3mJt_zk5MJ7wVSwDr4T_1XKg';
const MOVIES_SHEET_NAME = 'Movies';

// T4TSA Configuration
const T4TSA_BASE_URL = 'https://t4tsa.cc';
const T4TSA_MOVIES_CHANNEL = '@IrisMoviesX';
const T4TSA_BOT = '@PhonoFilmBot';

// TMDB API (Get from themoviedb.org)
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

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

function sendMessage(chatId, text, parseMode, replyMarkup) {
  parseMode = parseMode || 'HTML';
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

function sendPhoto(chatId, photoUrl, caption, replyMarkup) {
  caption = caption || '';
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
    const response = UrlFetchApp.fetch(`${TELEGRAM_API}/sendPhoto`, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log('Error sending photo: ' + error);
    sendMessage(chatId, caption, 'HTML', replyMarkup);
    return null;
  }
}

function sendDocument(chatId, fileId, caption, replyMarkup) {
  caption = caption || '';
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

function sendVideo(chatId, fileId, caption, replyMarkup) {
  caption = caption || '';
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

function answerCallbackQuery(callbackQueryId, text) {
  text = text || '';
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
// T4TSA SCRAPING FUNCTIONS
// ==========================================

function parseQueryForYear(query) {
  const yearMatch = query.match(/\b(19|20)\d{2}\b/);
  let movieName = query;
  let year = null;

  if (yearMatch) {
    year = yearMatch[0];
    movieName = query.replace(year, '').trim();
  }

  return { movieName: movieName, year: year };
}

function searchTMDB(query, year) {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'YOUR_TMDB_API_KEY') {
    Logger.log('TMDB_API_KEY not set');
    return [];
  }

  try {
    let url = TMDB_BASE_URL + '/search/movie?api_key=' + TMDB_API_KEY + 
              '&query=' + encodeURIComponent(query) + 
              '&include_adult=false&language=en-US&page=1';
    
    if (year) {
      url += '&year=' + year;
    }

    const options = {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    return data.results || [];
  } catch (error) {
    Logger.log('TMDB search error: ' + error);
    return [];
  }
}

function searchMovieOnTMDB(query) {
  const parsed = parseQueryForYear(query);
  const tmdbResults = searchTMDB(parsed.movieName, parsed.year);
  
  if (!tmdbResults || tmdbResults.length === 0) {
    return {
      success: false,
      message: 'No movies found on TMDB',
      results: []
    };
  }

  const results = tmdbResults.slice(0, 5).map(function(movie) {
    return {
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown',
      overview: movie.overview ? movie.overview.substring(0, 150) + '...' : '',
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
      poster: movie.poster_path ? 'https://image.tmdb.org/t/p/w200' + movie.poster_path : null,
      t4tsaUrl: T4TSA_BASE_URL + '/movie/' + movie.id
    };
  });

  return {
    success: true,
    query: parsed.movieName,
    year: parsed.year,
    results: results
  };
}

function fetchT4TSAPage(tmdbId) {
  try {
    const url = T4TSA_BASE_URL + '/movie/' + tmdbId;
    
    const options = {
      method: 'get',
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive'
      }
    };

    const response = UrlFetchApp.fetch(url, options);
    return response.getContentText();
  } catch (error) {
    Logger.log('T4TSA fetch error: ' + error);
    return null;
  }
}

function parseT4TSADownloads(html) {
  const downloads = {
    '720p': [],
    '1080p': [],
    'other': []
  };

  if (!html) return downloads;

  // Find Telegram links
  const telegramLinkRegex = /href=["'](https?:\/\/t\.me[^"']+)["'][^>]*>([^<]*)/gi;
  let match;
  
  while ((match = telegramLinkRegex.exec(html)) !== null) {
    const link = match[1];
    const text = match[2] || '';
    
    const item = { link: link, text: text };
    
    if (text.toLowerCase().indexOf('1080p') !== -1 || link.toLowerCase().indexOf('1080p') !== -1) {
      downloads['1080p'].push(item);
    } else if (text.toLowerCase().indexOf('720p') !== -1 || link.toLowerCase().indexOf('720p') !== -1) {
      downloads['720p'].push(item);
    } else {
      downloads['other'].push(item);
    }
  }

  // Find quality and size info from page text
  const qualityRegex = /(720p|1080p)[^<]*?(\d+\.?\d*\s*(GB|MB))/gi;
  while ((match = qualityRegex.exec(html)) !== null) {
    const quality = match[1];
    const size = match[2];
    const item = { text: match[0], size: size, quality: quality };
    
    if (quality === '1080p' && downloads['1080p'].length < 5) {
      const isDuplicate = downloads['1080p'].some(function(existing) {
        return existing.size === item.size;
      });
      if (!isDuplicate) {
        downloads['1080p'].push(item);
      }
    } else if (quality === '720p' && downloads['720p'].length < 5) {
      const isDuplicate = downloads['720p'].some(function(existing) {
        return existing.size === item.size;
      });
      if (!isDuplicate) {
        downloads['720p'].push(item);
      }
    }
  }

  // Also find button/download sections
  const buttonRegex = /class=["'][^"']*btn[^"']*["'][^>]*>([^<]*(?:720p|1080p)[^<]*)/gi;
  while ((match = buttonRegex.exec(html)) !== null) {
    const text = match[1];
    if (text.indexOf('1080p') !== -1) {
      downloads['1080p'].push({ text: text, quality: '1080p' });
    } else if (text.indexOf('720p') !== -1) {
      downloads['720p'].push({ text: text, quality: '720p' });
    }
  }

  return downloads;
}

function extractMovieInfo(html) {
  if (!html) return { title: '', year: '', description: '', rating: '' };
  
  // Extract title from h1 or title tag
  let title = '';
  const h1Match = html.match(/<h1[^>]*>([^<]+)</i);
  if (h1Match) {
    title = h1Match[1].trim();
  } else {
    const titleMatch = html.match(/<title>([^<]+)</i);
    if (titleMatch) {
      title = titleMatch[1].replace(' - T4TSA', '').trim();
    }
  }
  
  // Extract year
  const yearMatch = html.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : '';
  
  // Extract description from meta
  let description = '';
  const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (metaMatch) {
    description = metaMatch[1].substring(0, 200);
  }
  
  // Extract rating
  let rating = '';
  const ratingMatch = html.match(/(\d+\.?\d*)\s*\/\s*10/);
  if (ratingMatch) {
    rating = ratingMatch[1];
  }

  return {
    title: title,
    year: year,
    description: description,
    rating: rating
  };
}

function getT4TSADownloads(tmdbId) {
  // Check cache first
  const cache = CacheService.getScriptCache();
  const cacheKey = 't4tsa_' + tmdbId;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch(e) {}
  }
  
  const html = fetchT4TSAPage(tmdbId);
  
  if (!html) {
    return {
      success: false,
      message: 'Could not fetch movie page from T4TSA'
    };
  }

  const movieInfo = extractMovieInfo(html);
  const downloads = parseT4TSADownloads(html);

  const result = {
    success: true,
    movie: movieInfo,
    downloads: downloads,
    t4tsaUrl: T4TSA_BASE_URL + '/movie/' + tmdbId,
    available: {
      '720p': downloads['720p'].length > 0,
      '1080p': downloads['1080p'].length > 0
    },
    counts: {
      '720p': downloads['720p'].length,
      '1080p': downloads['1080p'].length
    }
  };
  
  // Cache for 1 hour
  try {
    cache.put(cacheKey, JSON.stringify(result), 3600);
  } catch(e) {}
  
  return result;
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
  
  for (var i = 1; i < data.length; i++) {
    const movieName = data[i][0].toString().toLowerCase();
    const year = data[i][1].toString();
    
    var matchScore = 0;
    searchTerms.forEach(function(term) {
      if (movieName.indexOf(term) !== -1 || year.indexOf(term) !== -1) {
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
  
  results.sort(function(a, b) { return b.score - a.score; });
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

// Store movie cache in Script Properties (for callback handling)
function cacheMovie(movie) {
  try {
    const cache = CacheService.getScriptCache();
    cache.put('movie_' + movie.id, JSON.stringify(movie), 3600);
  } catch(e) {}
}

function getCachedMovie(movieId) {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get('movie_' + movieId);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch(e) {}
  return null;
}

// ==========================================
// COMMAND HANDLERS
// ==========================================

function handleStartCommand(chatId, userName) {
  const welcomeMessage = 
    '🎬 <b>Welcome to Movie Bot, ' + userName + '!</b>\n\n' +
    'I can help you find and download movies from T4TSA.\n\n' +
    '<b>How to use:</b>\n' +
    '• Just send me a movie name\n' +
    '• Add year for better results: "Avatar 2009"\n' +
    '• Choose quality (720p or 1080p)\n' +
    '• Get the download link!\n\n' +
    '<b>Commands:</b>\n' +
    '/search movie name - Search for a movie\n' +
    '/help - Show help message\n' +
    '/channels - Show T4TSA channels\n\n' +
    'Just type a movie name to get started!';
  
  sendMessage(chatId, welcomeMessage);
}

function handleHelpCommand(chatId) {
  const helpMessage = 
    '🎬 <b>Movie Bot Help</b>\n\n' +
    '<b>Search Methods:</b>\n' +
    '1. <b>Simple search:</b> Just type the movie name\n' +
    '   Example: <code>Avatar</code>\n\n' +
    '2. <b>Search with year:</b> Add the year for accurate results\n' +
    '   Example: <code>Avatar 2009</code>\n\n' +
    '<b>Commands:</b>\n' +
    '/start - Start the bot\n' +
    '/help - Show this help\n' +
    '/search name - Search for a movie\n' +
    '/channels - T4TSA Telegram channels\n\n' +
    '<b>Available Qualities:</b>\n' +
    '📺 720p - Good quality, smaller file\n' +
    '📺 1080p - Full HD, larger file';
  
  sendMessage(chatId, helpMessage);
}

function handleChannelsCommand(chatId) {
  const channelsMessage = 
    '📺 <b>T4TSA Telegram Channels</b>\n\n' +
    '<b>Main Channel:</b>\n' +
    '@T4TSA - Main announcements\n\n' +
    '<b>Movies:</b>\n' +
    '@IrisMoviesX - Latest movies\n\n' +
    '<b>TV Series:</b>\n' +
    '@SeriesBayX - TV shows & series\n\n' +
    '<b>Bot for Single Movies:</b>\n' +
    '@PhonoFilmBot - Request specific movies\n\n' +
    '<b>Community:</b>\n' +
    '@FlicksChat - Chat & requests\n\n' +
    '<b>Website:</b>\n' +
    'https://t4tsa.cc';
  
  sendMessage(chatId, channelsMessage);
}

function handleT4TSASearch(chatId, query) {
  sendMessage(chatId, '🔍 Searching for "<b>' + query + '</b>" on T4TSA...');
  
  try {
    const searchResult = searchMovieOnTMDB(query);
    
    if (!searchResult.success || searchResult.results.length === 0) {
      var message = '❌ No movies found for "<b>' + query + '</b>"\n\n';
      message += '<b>Try:</b>\n';
      message += '• Different spelling\n';
      message += '• Adding the year (e.g., "Inception 2010")\n';
      message += '• Searching on T4TSA website directly';
      
      const buttons = [[
        { text: '🔍 Search on T4TSA Website', url: T4TSA_BASE_URL + '/?search=' + encodeURIComponent(query) }
      ]];
      
      sendMessage(chatId, message, 'HTML', createInlineKeyboard(buttons));
      return;
    }

    const results = searchResult.results;
    
    // Cache results for callback handling
    results.forEach(function(movie) {
      cacheMovie(movie);
    });
    
    if (results.length === 1) {
      showMovieWithQualities(chatId, results[0]);
    } else {
      var message = '🎬 <b>Found ' + results.length + ' movies for "' + query + '"</b>\n\n';
      message += '<i>Select a movie:</i>';
      
      const buttons = results.map(function(movie) {
        return [{
          text: '🎬 ' + movie.title + ' (' + movie.year + ') ⭐' + movie.rating,
          callback_data: 'movie_' + movie.id
        }];
      });
      
      sendMessage(chatId, message, 'HTML', createInlineKeyboard(buttons));
    }
    
  } catch (error) {
    Logger.log('T4TSA search error: ' + error);
    sendMessage(chatId, '❌ Error searching. Please try again later.');
  }
}

function showMovieWithQualities(chatId, movie) {
  try {
    const downloads = getT4TSADownloads(movie.id);
    const t4tsaUrl = T4TSA_BASE_URL + '/movie/' + movie.id;
    
    var message = '🎬 <b>' + movie.title + '</b> (' + movie.year + ')\n';
    message += '⭐ Rating: ' + movie.rating + '/10\n\n';
    
    if (movie.overview) {
      message += '📝 ' + movie.overview + '\n\n';
    }
    
    const buttons = [];
    
    if (downloads.success) {
      const count720 = downloads.counts['720p'] || 0;
      const count1080 = downloads.counts['1080p'] || 0;
      
      if (count720 > 0 || count1080 > 0) {
        message += '<b>Available on T4TSA:</b>\n';
        
        if (count720 > 0) {
          message += '📺 720p: ' + count720 + ' file(s)\n';
        }
        
        if (count1080 > 0) {
          message += '📺 1080p: ' + count1080 + ' file(s)\n';
        }
        
        message += '\n<i>Tap below to open T4TSA and download:</i>';
        
        buttons.push([{
          text: '📥 Download from T4TSA',
          url: t4tsaUrl
        }]);
      } else {
        message += '⚠️ No 720p/1080p files found.\n';
        message += '<i>Check T4TSA for other qualities:</i>';
        buttons.push([{
          text: '🌐 View on T4TSA',
          url: t4tsaUrl
        }]);
      }
    } else {
      message += '<i>Tap below to view downloads on T4TSA:</i>';
      buttons.push([{
        text: '🌐 View on T4TSA',
        url: t4tsaUrl
      }]);
    }
    
    if (movie.poster) {
      sendPhoto(chatId, movie.poster, message, createInlineKeyboard(buttons));
    } else {
      sendMessage(chatId, message, 'HTML', createInlineKeyboard(buttons));
    }
    
  } catch (error) {
    Logger.log('Show movie error: ' + error);
    sendMessage(chatId, '❌ Error fetching movie details. Please try again.');
  }
}

function handleSearchCommand(chatId, query) {
  if (!query || query.trim() === '') {
    sendMessage(chatId, '❌ Please provide a movie name.\n\nExample: /search Inception');
    return;
  }
  
  // First check local database
  const localResults = searchMovieInDatabase(query);
  
  if (localResults && localResults.length > 0) {
    const bestMatch = localResults[0];
    const caption = '🎬 <b>' + bestMatch.name + '</b> (' + bestMatch.year + ')\n📊 Quality: ' + bestMatch.quality + '\n📁 Size: ' + (bestMatch.size || 'Unknown');
    
    sendMessage(chatId, '⏳ Sending <b>' + bestMatch.name + '</b> from local database...');
    
    if (bestMatch.fileType === 'video') {
      sendVideo(chatId, bestMatch.fileId, caption);
    } else {
      sendDocument(chatId, bestMatch.fileId, caption);
    }
    
    if (localResults.length > 1) {
      const buttons = [];
      localResults.slice(1, 6).forEach(function(movie) {
        buttons.push([{
          text: '📁 ' + movie.name + ' (' + movie.year + ') - ' + movie.quality,
          callback_data: 'dl_' + movie.row
        }]);
      });
      
      buttons.push([{
        text: '🔍 Search more on T4TSA',
        callback_data: 't4tsa_' + encodeURIComponent(query)
      }]);
      
      if (buttons.length > 0) {
        sendMessage(chatId, '📋 <b>Other options:</b>', 'HTML', createInlineKeyboard(buttons));
      }
    }
  } else {
    // No local results, search T4TSA
    handleT4TSASearch(chatId, query);
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
    
    const caption = '🎬 <b>' + movieName + '</b> (' + year + ')\n📊 Quality: ' + quality + '\n📁 Size: ' + (size || 'Unknown');
    
    sendMessage(chatId, '⏳ Sending <b>' + movieName + '</b>...');
    
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
    if (ADMIN_IDS.indexOf(userId.toString()) === -1) {
      sendMessage(chatId, '❌ Only admins can add movies.');
      return;
    }
  }
  
  const message = 
    '📥 <b>Add Movie to Database</b>\n\n' +
    'To add a movie, forward a movie file from T4TSA channels to me.\n\n' +
    'Or send in this format:\n' +
    '<code>/save Movie Name | Year | Quality</code>\n\n' +
    'Example:\n' +
    '<code>/save Avatar | 2009 | 1080p</code>';
  
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
    var movieName = fileName.replace(/\.[^/.]+$/, '').replace(/[\._]/g, ' ');
    var year = '';
    
    if (nameMatch) {
      movieName = nameMatch[1].replace(/[\._]/g, ' ').trim();
      year = nameMatch[2];
    }
    
    const qualityMatch = fileName.match(/(480p|720p|1080p|2160p|4K|HDRip|BluRay|WEB-DL|WEBRip)/i);
    const quality = qualityMatch ? qualityMatch[1] : 'Unknown';
    
    const confirmMessage = 
      '📁 <b>File Received!</b>\n\n' +
      '<b>Detected Info:</b>\n' +
      '🎬 Name: ' + movieName + '\n' +
      '📅 Year: ' + (year || 'Unknown') + '\n' +
      '📊 Quality: ' + quality + '\n' +
      '📁 Size: ' + fileSize + '\n\n' +
      'Reply with movie details to save:\n' +
      '<code>/save ' + movieName + ' | ' + year + ' | ' + quality + '</code>\n\n' +
      'Or edit and send:\n' +
      '<code>/save Movie Name | Year | Quality</code>';
    
    PropertiesService.getUserProperties().setProperty('lastFileId_' + chatId, fileId);
    PropertiesService.getUserProperties().setProperty('lastFileType_' + chatId, fileType);
    PropertiesService.getUserProperties().setProperty('lastFileSize_' + chatId, fileSize);
    
    sendMessage(chatId, confirmMessage);
    return true;
  }
  
  return false;
}

function handleSaveCommand(chatId, args) {
  const parts = args.split('|').map(function(p) { return p.trim(); });
  
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
    
    sendMessage(chatId, '✅ <b>Movie saved!</b>\n\n🎬 ' + movieName + ' (' + year + ')\n📊 Quality: ' + quality + '\n\nUsers can now search and download this movie!');
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
    
    // Deduplication
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
  
  // Handle forwarded files
  if (message.forward_from || message.forward_from_chat) {
    if (handleForwardedFile(message, chatId)) {
      return;
    }
  }
  
  // Handle direct file uploads
  if (message.document || message.video) {
    handleForwardedFile(message, chatId);
    return;
  }
  
  // Handle commands
  const command = text.toLowerCase().split('@')[0];
  
  if (command === '/start' || text.toLowerCase().indexOf('/start ') === 0) {
    handleStartCommand(chatId, userName);
    return;
  }
  
  if (command === '/help' || text.toLowerCase().indexOf('/help ') === 0) {
    handleHelpCommand(chatId);
    return;
  }
  
  if (command === '/channels' || text.toLowerCase().indexOf('/channels ') === 0) {
    handleChannelsCommand(chatId);
    return;
  }
  
  if (text.toLowerCase().indexOf('/search ') === 0) {
    const query = text.substring(8).trim();
    handleSearchCommand(chatId, query);
    return;
  }
  
  if (command === '/addmovie' || text.toLowerCase().indexOf('/addmovie ') === 0) {
    handleAddMovie(chatId, userId);
    return;
  }
  
  if (text.toLowerCase().indexOf('/save ') === 0) {
    const args = text.substring(6).trim();
    handleSaveCommand(chatId, args);
    return;
  }
  
  if (text.toLowerCase().indexOf('/get_') === 0) {
    const index = parseInt(text.substring(5));
    handleDownload(chatId, index + 2);
    return;
  }
  
  // Unknown command
  if (text.indexOf('/') === 0) {
    sendMessage(chatId, '❌ Unknown command. Type /help for available commands.');
    return;
  }
  
  // Regular text = search for movie
  if (text.length > 0) {
    handleSearchCommand(chatId, text);
  }
}

function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const queryId = callbackQuery.id;
  
  answerCallbackQuery(queryId);
  
  // Download from local database
  if (data.indexOf('dl_') === 0) {
    const rowNumber = parseInt(data.substring(3));
    handleDownload(chatId, rowNumber);
    return;
  }
  
  // Show movie details from T4TSA
  if (data.indexOf('movie_') === 0) {
    const movieId = data.substring(6);
    const cachedMovie = getCachedMovie(movieId);
    
    if (cachedMovie) {
      showMovieWithQualities(chatId, cachedMovie);
    } else {
      const t4tsaUrl = T4TSA_BASE_URL + '/movie/' + movieId;
      sendMessage(chatId, '🎬 View this movie on T4TSA:\n' + t4tsaUrl, 'HTML', createInlineKeyboard([[
        { text: '🌐 Open on T4TSA', url: t4tsaUrl }
      ]]));
    }
    return;
  }
  
  // Search more on T4TSA
  if (data.indexOf('t4tsa_') === 0) {
    const query = decodeURIComponent(data.substring(6));
    handleT4TSASearch(chatId, query);
    return;
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<html>' +
    '<head><title>Movie Bot</title></head>' +
    '<body style="font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px;">' +
    '<h1>🎬 Movie Bot</h1>' +
    '<div style="background: #d4edda; padding: 15px; border-radius: 5px;">' +
    '<strong>Status:</strong> ✅ Bot is running with T4TSA Scraping!' +
    '</div>' +
    '<h3>Features:</h3>' +
    '<ul>' +
    '<li>Search movies via TMDB</li>' +
    '<li>Scrape T4TSA for download links</li>' +
    '<li>720p and 1080p quality detection</li>' +
    '<li>Google Sheets database</li>' +
    '</ul>' +
    '<h3>Commands:</h3>' +
    '<ul>' +
    '<li>/start - Start the bot</li>' +
    '<li>/search movie - Search for a movie</li>' +
    '<li>/channels - Show T4TSA channels</li>' +
    '</ul>' +
    '</body>' +
    '</html>'
  );
}

// ==========================================
// TEST FUNCTIONS
// ==========================================

function testBot() {
  const response = UrlFetchApp.fetch(TELEGRAM_API + '/getMe');
  Logger.log(response.getContentText());
}

function testTMDBSearch() {
  const results = searchMovieOnTMDB('Avatar 2009');
  Logger.log(JSON.stringify(results, null, 2));
}

function testT4TSAScrape() {
  // Test with Avatar (TMDB ID: 19995)
  const downloads = getT4TSADownloads(19995);
  Logger.log(JSON.stringify(downloads, null, 2));
}
