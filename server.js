const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

let CosmosClient;
try {
    CosmosClient = require('@azure/cosmos').CosmosClient;
} catch (e) {
    // dependency may not be installed locally; that's fine for local file fallback
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from current directory

const SCOREBOARD_FILE = path.join(__dirname, 'Scoreboard.json');

// Cosmos DB config via environment variables (set these in Azure App Service settings)
const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT;
const COSMOS_KEY = process.env.COSMOS_KEY;
const COSMOS_DB = process.env.COSMOS_DB || 'BaseDefenderDB';
const COSMOS_CONTAINER = process.env.COSMOS_CONTAINER || 'Scores';

const useCosmos = CosmosClient && COSMOS_ENDPOINT && COSMOS_KEY;
let cosmosClient, cosmosContainer;

async function initCosmos() {
    if (!useCosmos) return;
    try {
        cosmosClient = new CosmosClient({ endpoint: COSMOS_ENDPOINT, key: COSMOS_KEY });
        const { database } = await cosmosClient.databases.createIfNotExists({ id: COSMOS_DB });
        const { container } = await database.containers.createIfNotExists({ id: COSMOS_CONTAINER, partitionKey: { kind: 'Hash', paths: ['/partitionKey'] } });
        cosmosContainer = container;
        console.log('Connected to Cosmos DB:', COSMOS_DB, COSMOS_CONTAINER);
    } catch (err) {
        console.error('Error initializing Cosmos DB client:', err);
    }
}

initCosmos();

// Load scores (Cosmos DB if configured, otherwise file fallback)
async function loadScores() {
    if (useCosmos && cosmosContainer) {
        try {
            const querySpec = {
                query: 'SELECT TOP 100 c.name, c.score, c.wave, c.date FROM c WHERE c.partitionKey = @pk ORDER BY c.score DESC',
                parameters: [{ name: '@pk', value: 'scores' }]
            };
            const { resources } = await cosmosContainer.items.query(querySpec).fetchAll();
            return { scores: resources || [] };
        } catch (err) {
            console.error('Cosmos query error:', err);
            return { scores: [] };
        }
    }

    // File-based fallback (local development)
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

// Save a score (Cosmos DB if configured, otherwise file fallback)
async function saveScore(newScore) {
    if (useCosmos && cosmosContainer) {
        try {
            const item = Object.assign({}, newScore, {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                partitionKey: 'scores'
            });
            await cosmosContainer.items.create(item);
            return true;
        } catch (err) {
            console.error('Cosmos write error:', err);
            return false;
        }
    }

    // File-based fallback: keep top 100 in file
    try {
        const data = loadScores();
        // loadScores may return a promise when used above; handle it
        const current = (data instanceof Promise) ? await data : data;
        current.scores = current.scores || [];
        current.scores.push(newScore);
        current.scores.sort((a, b) => (b.score || 0) - (a.score || 0));
        current.scores = current.scores.slice(0, 100);
        fs.writeFileSync(SCOREBOARD_FILE, JSON.stringify(current, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error('Error writing to Scoreboard.json:', err);
        return false;
    }
}

// GET /scores - Load all scores
app.get('/scores', async (req, res) => {
    try {
        const data = await loadScores();
        res.json(data.scores || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load scores' });
    }
});

// POST /scores - Save a new score
app.post('/scores', async (req, res) => {
    try {
        const { name, score, wave, game } = req.body;

        // Validate input
        if (!name || typeof score !== 'number') {
            return res.status(400).json({ error: 'Invalid score data' });
        }

        const newScore = {
            name: String(name).substring(0, 32),
            score: Number(score),
            wave: wave ? Number(wave) : null,
            game: game ? String(game) : 'basedefender',
            date: new Date().toISOString()
        };

        const ok = await saveScore(newScore);
        if (ok) {
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
    if (!useCosmos) {
        console.log('Using file-based scoreboard:', SCOREBOARD_FILE);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});
