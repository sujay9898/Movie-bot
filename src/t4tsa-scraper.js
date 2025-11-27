import axios from 'axios';
import * as cheerio from 'cheerio';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const T4TSA_BASE_URL = 'https://t4tsa.cc';

async function searchTMDB(query, year = null) {
  if (!TMDB_API_KEY) {
    console.log('TMDB_API_KEY not set');
    return [];
  }

  try {
    let url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
    
    if (year) {
      url += `&year=${year}`;
    }

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    return response.data.results || [];
  } catch (error) {
    console.error('TMDB search error:', error.message);
    return [];
  }
}

function parseQueryForYear(query) {
  const yearMatch = query.match(/\b(19|20)\d{2}\b/);
  let movieName = query;
  let year = null;

  if (yearMatch) {
    year = yearMatch[0];
    movieName = query.replace(year, '').trim();
  }

  return { movieName, year };
}

async function fetchT4TSAMoviePage(tmdbId) {
  try {
    const url = `${T4TSA_BASE_URL}/movie/${tmdbId}`;
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive'
      }
    });

    return response.data;
  } catch (error) {
    console.error('T4TSA fetch error:', error.message);
    return null;
  }
}

function parseDownloadLinks(html, filterQualities = ['720p', '1080p']) {
  const $ = cheerio.load(html);
  const downloads = {
    '720p': [],
    '1080p': [],
    'other': []
  };

  $('a[href*="t.me"], a[href*="telegram"]').each((i, elem) => {
    const link = $(elem).attr('href');
    const text = $(elem).text().trim() || $(elem).parent().text().trim();
    
    if (link) {
      const item = { link, text };
      
      if (text.toLowerCase().includes('1080p') || link.toLowerCase().includes('1080p')) {
        downloads['1080p'].push(item);
      } else if (text.toLowerCase().includes('720p') || link.toLowerCase().includes('720p')) {
        downloads['720p'].push(item);
      } else {
        downloads['other'].push(item);
      }
    }
  });

  $('button, div[role="button"]').each((i, elem) => {
    const parentText = $(elem).parent().text();
    const elemText = $(elem).text().trim();
    
    const sizeMatch = parentText.match(/(\d+\.?\d*\s*(GB|MB))/i);
    const qualityMatch = parentText.match(/(480p|720p|1080p|2160p|4K)/i);
    
    if (sizeMatch) {
      const item = {
        text: parentText.substring(0, 100).trim(),
        size: sizeMatch[1],
        quality: qualityMatch ? qualityMatch[1] : 'Unknown'
      };
      
      if (item.quality === '1080p') {
        downloads['1080p'].push(item);
      } else if (item.quality === '720p') {
        downloads['720p'].push(item);
      }
    }
  });

  const textContent = $.text();
  const lines = textContent.split('\n');
  
  lines.forEach(line => {
    const cleanLine = line.trim();
    if (!cleanLine) return;
    
    const sizeMatch = cleanLine.match(/(\d+\.?\d*\s*(GB|MB))/i);
    const qualityMatch = cleanLine.match(/(720p|1080p)/i);
    
    if (sizeMatch && qualityMatch) {
      const item = {
        text: cleanLine.substring(0, 150),
        size: sizeMatch[1],
        quality: qualityMatch[1]
      };
      
      const isDuplicate = downloads[item.quality].some(
        existing => existing.text === item.text || existing.size === item.size
      );
      
      if (!isDuplicate) {
        downloads[item.quality].push(item);
      }
    }
  });

  return downloads;
}

function extractMovieInfoFromPage(html) {
  const $ = cheerio.load(html);
  
  const title = $('h1').first().text().trim() || 
                $('title').text().replace(' - T4TSA', '').trim();
  
  const yearMatch = $.text().match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : '';
  
  const description = $('meta[name="description"]').attr('content') || 
                      $('p').first().text().trim().substring(0, 200);
  
  const ratingMatch = $.text().match(/(\d+\.?\d*)\s*\/\s*10|\b(\d+\.?\d*)\s*\(.*votes?\)/i);
  const rating = ratingMatch ? (ratingMatch[1] || ratingMatch[2]) : '';

  return {
    title,
    year,
    description,
    rating
  };
}

async function searchMovie(query) {
  const { movieName, year } = parseQueryForYear(query);
  
  const tmdbResults = await searchTMDB(movieName, year);
  
  if (!tmdbResults || tmdbResults.length === 0) {
    return {
      success: false,
      message: 'No movies found on TMDB',
      results: []
    };
  }

  const results = tmdbResults.slice(0, 5).map(movie => ({
    id: movie.id,
    title: movie.title,
    year: movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown',
    overview: movie.overview ? movie.overview.substring(0, 150) + '...' : '',
    rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
    poster: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null,
    t4tsaUrl: `${T4TSA_BASE_URL}/movie/${movie.id}`
  }));

  return {
    success: true,
    query: movieName,
    year: year,
    results: results
  };
}

async function getMovieDownloads(tmdbId) {
  const html = await fetchT4TSAMoviePage(tmdbId);
  
  if (!html) {
    return {
      success: false,
      message: 'Could not fetch movie page from T4TSA'
    };
  }

  const movieInfo = extractMovieInfoFromPage(html);
  const downloads = parseDownloadLinks(html);

  const has720p = downloads['720p'].length > 0;
  const has1080p = downloads['1080p'].length > 0;

  return {
    success: true,
    movie: movieInfo,
    downloads: downloads,
    t4tsaUrl: `${T4TSA_BASE_URL}/movie/${tmdbId}`,
    available: {
      '720p': has720p,
      '1080p': has1080p
    },
    counts: {
      '720p': downloads['720p'].length,
      '1080p': downloads['1080p'].length
    }
  };
}

async function searchAndGetDownloads(query) {
  const searchResult = await searchMovie(query);
  
  if (!searchResult.success || searchResult.results.length === 0) {
    return {
      success: false,
      message: `No movies found for "${query}"`
    };
  }

  const firstResult = searchResult.results[0];
  const downloads = await getMovieDownloads(firstResult.id);

  return {
    success: downloads.success,
    movie: {
      ...firstResult,
      ...downloads.movie
    },
    downloads: downloads.downloads,
    t4tsaUrl: downloads.t4tsaUrl,
    available: downloads.available,
    counts: downloads.counts,
    otherResults: searchResult.results.slice(1)
  };
}

export {
  searchMovie,
  getMovieDownloads,
  searchAndGetDownloads,
  parseQueryForYear
};
