# BaseDefender - Scoreboard Setup & Deployment Guide

## 📋 What I've Created

1. **Scoreboard.json** - JSON file to store all player scores
2. **server.js** - Node.js backend server to handle score saving
3. **package.json** - Project dependencies
4. **.gitignore** - Files to exclude from version control
5. **Updated menu.js** - Game now loads scores from Scoreboard.json

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Server
```bash
npm start
```

The server will run on `http://localhost:3000`

### 3. Open the Game
- Navigate to `http://localhost:3000` in your browser
- Play the game and submit your score when you lose
- Your scores will be saved to `Scoreboard.json`

## 📝 How It Works

### Score Flow:
1. **Game Ends** → Player enters their name
2. **Score Submission** → Game POSTs to `/scores` endpoint
3. **Server Saves** → Score is added to `Scoreboard.json`
4. **Display Scores** → Game loads from `Scoreboard.json` to show leaderboard

### Score Data Structure:
```json
{
  "scores": [
    {
      "name": "Player Name",
      "score": 1500,
      "wave": 5,
      "date": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## 🌍 Deployment Options

### Option 1: Heroku (Free/Paid)
```bash
# Install Heroku CLI, then:
heroku create your-app-name
git push heroku main
```

### Option 2: Railway.app (Recommended - Simple)
1. Push code to GitHub
2. Connect to Railway.app
3. Auto-deploys on git push
4. Scoreboard.json is persisted in their storage

### Option 3: Vercel + External API
- Host static files on Vercel
- Use Firebase Realtime DB or similar for scores
- Modify server.js to use database instead of file

### Option 4: DigitalOcean / AWS / VPS
- Run `npm install && npm start` on your server
- Use PM2 or similar to keep server running
- Set up nginx reverse proxy

## ⚙️ Environment Variables (Optional)

Create a `.env` file:
```
PORT=3000
NODE_ENV=production
```

## 🔧 Customization

### Change Server Port:
Edit `server.js` or set environment variable:
```bash
PORT=5000 npm start
```

### Max Scores Stored:
In `server.js`, find this line and change the number:
```javascript
data.scores = data.scores.slice(0, 100); // Change 100 to your desired limit
```

### Run Score Validation:
Check Scoreboard.json integrity:
```bash
node -e "console.log(require('./Scoreboard.json'))"
```

## 🐛 Troubleshooting

**Scores not saving?**
- Check browser console for fetch errors
- Make sure server is running on correct port
- Verify Scoreboard.json has write permissions

**Scoreboard.json keeps getting replaced?**
- This is normal - the server updates it with new scores
- Keep backups if needed

**CORS errors?**
- The server already includes CORS headers
- Make sure you're accessing from the correct host

## 📦 Files Added/Modified

- ✅ Created: `Scoreboard.json` - Score storage
- ✅ Created: `server.js` - Backend API
- ✅ Created: `package.json` - Dependencies
- ✅ Created: `.gitignore` - Git exclusions
- ✅ Modified: `menu.js` - Now loads from Scoreboard.json

## 🎮 Testing

1. Start the server: `npm start`
2. Open http://localhost:3000
3. Play and lose a game
4. Enter your name and submit score
5. Check `Scoreboard.json` - your score should be there!
6. Reload the game - your score should appear in leaderboard

---

**Need help?** Check the browser console and server logs for errors!
