import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Movie Bot - Google Apps Script</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            max-width: 700px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #764ba2;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        .status-box {
            background: #e8f5e9;
            border-left: 4px solid #4caf50;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .status-box h3 {
            color: #2e7d32;
            margin-bottom: 5px;
        }
        .info-box {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .info-box h3 {
            color: #1565c0;
            margin-bottom: 10px;
        }
        .steps {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .steps h3 {
            color: #333;
            margin-bottom: 15px;
        }
        .steps ol {
            margin-left: 20px;
            line-height: 1.8;
        }
        .steps li {
            margin-bottom: 8px;
        }
        .steps code {
            background: #e0e0e0;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
        .file-location {
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 25px;
        }
        .file-location h3 {
            color: #e65100;
            margin-bottom: 10px;
        }
        .file-location code {
            background: #ffe0b2;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            display: block;
            margin-top: 5px;
        }
        .footer {
            text-align: center;
            color: #999;
            font-size: 0.9em;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Movie Bot</h1>
        <p class="subtitle">Telegram Bot for searching and downloading movies from T4TSA</p>
        
        <div class="status-box">
            <h3>Bot Status: Running on Google Apps Script</h3>
            <p>This bot is configured to run exclusively on Google Apps Script, not on Replit.</p>
        </div>
        
        <div class="info-box">
            <h3>Why Google Apps Script?</h3>
            <p>Google Apps Script provides free hosting with Google Sheets as database, making it perfect for Telegram bots without server costs.</p>
        </div>
        
        <div class="file-location">
            <h3>Code Location</h3>
            <p>The Google Apps Script code is saved at:</p>
            <code>google-apps-script/Code.gs</code>
        </div>
        
        <div class="steps">
            <h3>Deployment Steps:</h3>
            <ol>
                <li>Go to <a href="https://script.google.com" target="_blank">script.google.com</a></li>
                <li>Create a new project</li>
                <li>Copy the code from <code>google-apps-script/Code.gs</code></li>
                <li>Update the configuration variables at the top:
                    <ul>
                        <li>BOT_TOKEN - from @BotFather</li>
                        <li>SPREADSHEET_ID - your Google Sheet ID</li>
                        <li>ADMIN_IDS - your Telegram user ID</li>
                    </ul>
                </li>
                <li>Deploy as Web App (Execute as: Me, Access: Anyone)</li>
                <li>Copy the Web App URL and set it in <code>WEB_APP_URL</code></li>
                <li>Run <code>clearAndSetWebhook()</code> function to connect to Telegram</li>
            </ol>
        </div>
        
        <div class="footer">
            <p>Movie Bot - Powered by Google Apps Script</p>
        </div>
    </div>
</body>
</html>
  `);
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('Movie Bot info page running on port ' + PORT);
  console.log('Bot runs on Google Apps Script - not on Replit');
});
