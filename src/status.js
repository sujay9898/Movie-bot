import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Telegram Movie Bot</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
          }
          h1 { 
            color: #333;
            margin-bottom: 10px;
            font-size: 2rem;
          }
          .subtitle {
            color: #666;
            margin-bottom: 30px;
          }
          .status {
            background: #d4edda;
            color: #155724;
            padding: 15px 20px;
            border-radius: 10px;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .status-dot {
            width: 12px;
            height: 12px;
            background: #28a745;
            border-radius: 50%;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .section {
            margin-bottom: 25px;
          }
          h3 {
            color: #333;
            margin-bottom: 10px;
            font-size: 1.1rem;
          }
          ul {
            list-style: none;
            padding: 0;
          }
          li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          li:last-child { border-bottom: none; }
          code {
            background: #f4f4f4;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.9rem;
          }
          .links a {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            margin-right: 10px;
            margin-top: 10px;
            transition: transform 0.2s;
          }
          .links a:hover {
            transform: translateY(-2px);
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #888;
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎬 Telegram Movie Bot</h1>
          <p class="subtitle">Search and download movies via Telegram</p>
          
          <div class="status">
            <div class="status-dot"></div>
            <span><strong>Status:</strong> Running on Google Apps Script</span>
          </div>
          
          <div class="section">
            <h3>📋 Bot Commands</h3>
            <ul>
              <li>📌 <code>/start</code> Start the bot</li>
              <li>❓ <code>/help</code> Show help message</li>
              <li>🔍 <code>/search movie</code> Search for a movie</li>
              <li>📺 <code>/channels</code> Show T4TSA channels</li>
              <li>➕ <code>/addmovie</code> Add movie (admin)</li>
            </ul>
          </div>
          
          <div class="section">
            <h3>🔗 Useful Links</h3>
            <div class="links">
              <a href="https://t.me/IrisMoviesX" target="_blank">@IrisMoviesX</a>
              <a href="https://t.me/PhonoFilmBot" target="_blank">@PhonoFilmBot</a>
              <a href="https://t4tsa.cc" target="_blank">T4TSA Website</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Deployed on Google Apps Script | Database: Google Sheets</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    deployment: 'Google Apps Script',
    timestamp: new Date().toISOString() 
  });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Status page running on port ${PORT}`);
});
