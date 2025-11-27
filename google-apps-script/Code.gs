// ==========================================
// TELEGRAM MOVIE BOT - GOOGLE APPS SCRIPT
// WITH T4TSA SCRAPING
// ==========================================

// CONFIGURATION
const BOT_TOKEN = '8022257010:AAGG5pNILYBtSGCbZY6wNeUwjCknccZDq_8';
const TELEGRAM_API = 'https://api.telegram.org/bot' + BOT_TOKEN;
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw1PN5RyHoTq6MOgVsOVhr97lFXsaEf5ZRWTyri83iVxy-bnie3_eHLPwgHvbyTd6R1tg/exec';

// Google Sheet Database
const SPREADSHEET_ID = '1oi0ts8bW6FClMiPRkie3mJt_zk5MJ7wVSwDr4T_1XKg';
const MOVIES_SHEET_NAME = 'Movies';

// T4TSA Configuration
const T4TSA_BASE_URL = 'https://t4tsa.cc';

// TMDB API
const TMDB_API_KEY = '19861d6a9e6917178763eb4dadcc1b2f';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Admin IDs
const ADMIN_IDS = ['YOUR_TELEGRAM_USER_ID'];

// ==========================================
// WEBHOOK SETUP FUNCTIONS
// ==========================================

function clearAndSetWebhook() {
  Logger.log('=== CLEARING OLD WEBHOOKS ===');
  
  var deleteUrl = TELEGRAM_API + '/deleteWebhook?drop_pending_updates=true';
  UrlFetchApp.fetch(deleteUrl);
  
  Utilities.sleep(2000);
  
  var setUrl = TELEGRAM_API + '/setWebhook?url=' + encodeURIComponent(WEB_APP_URL) + '&drop_pending_updates=true';
  var response = UrlFetchApp.fetch(setUrl);
  Logger.log('Set webhook: ' + response.getContentText());
  
  Utilities.sleep(1000);
  
  var infoUrl = TELEGRAM_API + '/getWebhookInfo';
  var info = UrlFetchApp.fetch(infoUrl);
  Logger.log('Webhook info: ' + info.getContentText());
}

function getWebhookInfo() {
  var url = TELEGRAM_API + '/getWebhookInfo';
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

// ==========================================
// TELEGRAM MESSAGE FUNCTIONS
// ==========================================

function sendMessage(chatId, text, parseMode, replyMarkup) {
  var payload = {
    chat_id: chatId,
    text: text,
    parse_mode: parseMode || 'HTML',
    disable_web_page_preview: false
  };
  
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(TELEGRAM_API + '/sendMessage', options);
  } catch (error) {
    Logger.log('sendMessage error: ' + error);
  }
}

function sendPhoto(chatId, photoUrl, caption, replyMarkup) {
  var payload = {
    chat_id: chatId,
    photo: photoUrl,
    caption: caption || '',
    parse_mode: 'HTML'
  };
  
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(TELEGRAM_API + '/sendPhoto', options);
  } catch (error) {
    Logger.log('sendPhoto error: ' + error);
    sendMessage(chatId, caption, 'HTML', replyMarkup);
  }
}

function answerCallbackQuery(callbackQueryId, text) {
  var payload = {
    callback_query_id: callbackQueryId,
    text: text || ''
  };
  
  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(TELEGRAM_API + '/answerCallbackQuery', options);
  } catch (error) {
    Logger.log('answerCallback error: ' + error);
  }
}

function createInlineKeyboard(buttons) {
  return JSON.stringify({
    inline_keyboard: buttons
  });
}

// ==========================================
// TMDB SEARCH FUNCTIONS
// ==========================================

function parseQueryForYear(query) {
  var yearMatch = query.match(/\b(19|20)\d{2}\b/);
  var movieName = query;
  var year = null;

  if (yearMatch) {
    year = yearMatch[0];
    movieName = query.replace(year, '').trim();
  }

  return { movieName: movieName, year: year };
}

function searchTMDB(query, year) {
  try {
    var url = TMDB_BASE_URL + '/search/movie?api_key=' + TMDB_API_KEY + 
              '&query=' + encodeURIComponent(query) + 
              '&include_adult=false&language=en-US&page=1';
    
    if (year) {
      url = url + '&year=' + year;
    }

    var options = {
      method: 'get',
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var data = JSON.parse(response.getContentText());
    
    Logger.log('TMDB response: ' + JSON.stringify(data).substring(0, 500));
    
    return data.results || [];
  } catch (error) {
    Logger.log('TMDB search error: ' + error);
    return [];
  }
}

function searchMovieOnTMDB(query) {
  var parsed = parseQueryForYear(query);
  
  Logger.log('Searching TMDB for: ' + parsed.movieName + ' year: ' + parsed.year);
  
  var tmdbResults = searchTMDB(parsed.movieName, parsed.year);
  
  if (!tmdbResults || tmdbResults.length === 0) {
    return {
      success: false,
      message: 'No movies found',
      results: []
    };
  }

  var results = [];
  for (var i = 0; i < Math.min(tmdbResults.length, 5); i++) {
    var movie = tmdbResults[i];
    results.push({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown',
      overview: movie.overview ? movie.overview.substring(0, 150) + '...' : '',
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
      poster: movie.poster_path ? 'https://image.tmdb.org/t/p/w200' + movie.poster_path : null
    });
  }

  return {
    success: true,
    query: parsed.movieName,
    year: parsed.year,
    results: results
  };
}

// ==========================================
// T4TSA FUNCTIONS
// ==========================================

function fetchT4TSAPage(tmdbId) {
  try {
    var url = T4TSA_BASE_URL + '/movie/' + tmdbId;
    
    var options = {
      method: 'get',
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    var response = UrlFetchApp.fetch(url, options);
    return response.getContentText();
  } catch (error) {
    Logger.log('T4TSA fetch error: ' + error);
    return null;
  }
}

function parseT4TSADownloads(html) {
  var downloads = {
    '720p': [],
    '1080p': [],
    'other': []
  };

  if (!html) return downloads;

  // Find quality mentions
  var qualityRegex = /(720p|1080p)/gi;
  var match;
  
  while ((match = qualityRegex.exec(html)) !== null) {
    var quality = match[1].toLowerCase();
    if (quality === '1080p') {
      downloads['1080p'].push({ quality: '1080p' });
    } else if (quality === '720p') {
      downloads['720p'].push({ quality: '720p' });
    }
  }

  // Remove duplicates
  downloads['720p'] = downloads['720p'].slice(0, 1);
  downloads['1080p'] = downloads['1080p'].slice(0, 1);

  return downloads;
}

function getT4TSADownloads(tmdbId) {
  try {
    var cache = CacheService.getScriptCache();
    var cacheKey = 't4tsa_' + tmdbId;
    var cached = cache.get(cacheKey);
    
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch(e) {}
    }
    
    var html = fetchT4TSAPage(tmdbId);
    
    if (!html) {
      return {
        success: false,
        message: 'Could not fetch T4TSA page'
      };
    }

    var downloads = parseT4TSADownloads(html);

    var result = {
      success: true,
      downloads: downloads,
      t4tsaUrl: T4TSA_BASE_URL + '/movie/' + tmdbId,
      available: {
        '720p': downloads['720p'].length > 0,
        '1080p': downloads['1080p'].length > 0
      }
    };
    
    // Cache for 1 hour
    try {
      cache.put(cacheKey, JSON.stringify(result), 3600);
    } catch(e) {}
    
    return result;
  } catch (error) {
    Logger.log('getT4TSADownloads error: ' + error);
    return {
      success: false,
      message: 'Error fetching downloads'
    };
  }
}

// ==========================================
// CACHE FUNCTIONS
// ==========================================

function cacheMovie(movie) {
  try {
    var cache = CacheService.getScriptCache();
    cache.put('movie_' + movie.id, JSON.stringify(movie), 3600);
  } catch(e) {
    Logger.log('Cache error: ' + e);
  }
}

function getCachedMovie(movieId) {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get('movie_' + movieId);
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
  var message = '🎬 <b>Welcome to Movie Bot, ' + userName + '!</b>\n\n' +
    'I can help you find movies from T4TSA.\n\n' +
    '<b>How to use:</b>\n' +
    '• Just send me a movie name\n' +
    '• Add year for better results: "Avatar 2009"\n\n' +
    '<b>Commands:</b>\n' +
    '/search movie name - Search for a movie\n' +
    '/help - Show help message\n' +
    '/channels - Show T4TSA channels\n\n' +
    'Just type a movie name to get started!';
  
  sendMessage(chatId, message);
}

function handleHelpCommand(chatId) {
  var message = '🎬 <b>Movie Bot Help</b>\n\n' +
    '<b>Search Methods:</b>\n' +
    '1. Just type the movie name\n' +
    '   Example: <code>Avatar</code>\n\n' +
    '2. Add year for accurate results\n' +
    '   Example: <code>Avatar 2009</code>\n\n' +
    '<b>Commands:</b>\n' +
    '/start - Start the bot\n' +
    '/help - Show this help\n' +
    '/search name - Search for a movie\n' +
    '/channels - T4TSA channels';
  
  sendMessage(chatId, message);
}

function handleChannelsCommand(chatId) {
  var message = '📺 <b>T4TSA Telegram Channels</b>\n\n' +
    '<b>Movies:</b> @IrisMoviesX\n' +
    '<b>TV Series:</b> @SeriesBayX\n' +
    '<b>Bot:</b> @PhonoFilmBot\n' +
    '<b>Chat:</b> @FlicksChat\n\n' +
    '<b>Website:</b> https://t4tsa.cc';
  
  sendMessage(chatId, message);
}

function handleSearchCommand(chatId, query) {
  if (!query || query.trim() === '') {
    sendMessage(chatId, '❌ Please provide a movie name.\n\nExample: /search Inception');
    return;
  }
  
  Logger.log('Searching for: ' + query);
  
  sendMessage(chatId, '🔍 Searching for "<b>' + query + '</b>"...');
  
  try {
    var searchResult = searchMovieOnTMDB(query);
    
    Logger.log('Search result: ' + JSON.stringify(searchResult).substring(0, 500));
    
    if (!searchResult.success || searchResult.results.length === 0) {
      var message = '❌ No movies found for "<b>' + query + '</b>"\n\n';
      message = message + '<b>Try:</b>\n';
      message = message + '• Different spelling\n';
      message = message + '• Adding the year\n';
      message = message + '• Search on T4TSA directly';
      
      var buttons = [[
        { text: '🔍 Search on T4TSA', url: T4TSA_BASE_URL + '/?s=' + encodeURIComponent(query) }
      ]];
      
      sendMessage(chatId, message, 'HTML', createInlineKeyboard(buttons));
      return;
    }

    var results = searchResult.results;
    
    // Cache results
    for (var i = 0; i < results.length; i++) {
      cacheMovie(results[i]);
    }
    
    if (results.length === 1) {
      showMovieDetails(chatId, results[0]);
    } else {
      var message = '🎬 <b>Found ' + results.length + ' movies:</b>\n\n';
      message = message + '<i>Select a movie:</i>';
      
      var buttons = [];
      for (var i = 0; i < results.length; i++) {
        var movie = results[i];
        buttons.push([{
          text: '🎬 ' + movie.title + ' (' + movie.year + ') ⭐' + movie.rating,
          callback_data: 'movie_' + movie.id
        }]);
      }
      
      sendMessage(chatId, message, 'HTML', createInlineKeyboard(buttons));
    }
    
  } catch (error) {
    Logger.log('Search error: ' + error);
    sendMessage(chatId, '❌ Error searching. Please try again.');
  }
}

function showMovieDetails(chatId, movie) {
  try {
    var t4tsaUrl = T4TSA_BASE_URL + '/movie/' + movie.id;
    
    var message = '🎬 <b>' + movie.title + '</b> (' + movie.year + ')\n';
    message = message + '⭐ Rating: ' + movie.rating + '/10\n\n';
    
    if (movie.overview) {
      message = message + '📝 ' + movie.overview + '\n\n';
    }
    
    // Try to get T4TSA info
    var downloads = getT4TSADownloads(movie.id);
    
    if (downloads.success && (downloads.available['720p'] || downloads.available['1080p'])) {
      message = message + '<b>Available on T4TSA:</b>\n';
      if (downloads.available['720p']) {
        message = message + '📺 720p\n';
      }
      if (downloads.available['1080p']) {
        message = message + '📺 1080p\n';
      }
      message = message + '\n';
    }
    
    message = message + '<i>Tap below to download:</i>';
    
    var buttons = [[{
      text: '📥 Download from T4TSA',
      url: t4tsaUrl
    }]];
    
    if (movie.poster) {
      sendPhoto(chatId, movie.poster, message, createInlineKeyboard(buttons));
    } else {
      sendMessage(chatId, message, 'HTML', createInlineKeyboard(buttons));
    }
    
  } catch (error) {
    Logger.log('showMovieDetails error: ' + error);
    sendMessage(chatId, '❌ Error showing movie details. Please try again.');
  }
}

// ==========================================
// MAIN HANDLERS
// ==========================================

function doPost(e) {
  try {
    var update = JSON.parse(e.postData.contents);
    
    Logger.log('Received update: ' + JSON.stringify(update).substring(0, 500));
    
    // Deduplication
    var updateId = update.update_id;
    var cache = CacheService.getScriptCache();
    var cacheKey = 'processed_' + updateId;
    
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
  try {
    var chatId = message.chat.id;
    var text = (message.text || '').trim();
    var userName = message.from.first_name || 'User';
    
    Logger.log('Message from ' + chatId + ': ' + text);
    
    if (!text) {
      return;
    }
    
    // Commands
    var lowerText = text.toLowerCase();
    
    if (lowerText === '/start' || lowerText.indexOf('/start ') === 0) {
      handleStartCommand(chatId, userName);
      return;
    }
    
    if (lowerText === '/help' || lowerText.indexOf('/help ') === 0) {
      handleHelpCommand(chatId);
      return;
    }
    
    if (lowerText === '/channels' || lowerText.indexOf('/channels ') === 0) {
      handleChannelsCommand(chatId);
      return;
    }
    
    if (lowerText.indexOf('/search ') === 0) {
      var query = text.substring(8).trim();
      handleSearchCommand(chatId, query);
      return;
    }
    
    // Unknown command
    if (text.charAt(0) === '/') {
      sendMessage(chatId, '❌ Unknown command. Type /help for available commands.');
      return;
    }
    
    // Regular text = search for movie
    handleSearchCommand(chatId, text);
    
  } catch (error) {
    Logger.log('handleMessage error: ' + error);
    try {
      sendMessage(message.chat.id, '❌ Error processing your message. Please try again.');
    } catch(e) {}
  }
}

function handleCallbackQuery(callbackQuery) {
  try {
    var chatId = callbackQuery.message.chat.id;
    var data = callbackQuery.data;
    var queryId = callbackQuery.id;
    
    answerCallbackQuery(queryId);
    
    // Movie selection
    if (data.indexOf('movie_') === 0) {
      var movieId = data.substring(6);
      var cachedMovie = getCachedMovie(movieId);
      
      if (cachedMovie) {
        showMovieDetails(chatId, cachedMovie);
      } else {
        var t4tsaUrl = T4TSA_BASE_URL + '/movie/' + movieId;
        var buttons = [[{ text: '🌐 Open on T4TSA', url: t4tsaUrl }]];
        sendMessage(chatId, '🎬 View this movie on T4TSA:', 'HTML', createInlineKeyboard(buttons));
      }
      return;
    }
    
  } catch (error) {
    Logger.log('handleCallbackQuery error: ' + error);
  }
}

function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<h1>🎬 Movie Bot</h1>' +
    '<p>Status: ✅ Running</p>' +
    '<p>Bot is active and ready to search movies!</p>'
  );
}

// ==========================================
// TEST FUNCTIONS
// ==========================================

function testTMDB() {
  var results = searchMovieOnTMDB('Avatar 2009');
  Logger.log(JSON.stringify(results, null, 2));
}

function testSearch() {
  var results = searchTMDB('Avatar', '2009');
  Logger.log(JSON.stringify(results, null, 2));
}
