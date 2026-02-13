const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from current directory

const SCOREBOARD_FILE = path.join(__dirname, 'Scoreboard.json');

// Load scores from file
function loadScores() {
    try {
        if (fs.existsSync(SCOREBOARD_FILE)) {
            const data = fs.readFileSync(SCOREBOARD_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error reading Scoreboard.json:', err);
    }
    return { scores: [] };
}

// Save scores to file
function saveScores(data) {
    try {
        fs.writeFileSync(SCOREBOARD_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('Error writing to Scoreboard.json:', err);
        return false;
    }
}

// GET /scores - Load all scores
app.get('/scores', (req, res) => {
    try {
        const data = loadScores();
        res.json(data.scores || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load scores' });
    }
});

// POST /scores - Save a new score
app.post('/scores', (req, res) => {
    try {
        const { name, score, wave } = req.body;

        // Validate input
        if (!name || typeof score !== 'number' || typeof wave !== 'number') {
            return res.status(400).json({ error: 'Invalid score data' });
        }

        // Load current scores
        const data = loadScores();
        
        // Add new score
        const newScore = {
            name: String(name).substring(0, 32),
            score: Number(score),
            wave: Number(wave),
            date: new Date().toISOString()
        };

        data.scores.push(newScore);

        // Keep only top 100 scores
        data.scores.sort((a, b) => (b.score || 0) - (a.score || 0));
        data.scores = data.scores.slice(0, 100);

        // Save to file
        if (saveScores(data)) {
            res.json({ success: true, message: 'Score saved', score: newScore });
        } else {
            res.status(500).json({ error: 'Failed to save score' });
        }
    } catch (err) {
        console.error('Error saving score:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server - listen on 0.0.0.0 for Azure compatibility
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 BaseDefender server running on port ${PORT}`);
    console.log('Scoreboard.json file:', SCOREBOARD_FILE);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});
