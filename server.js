const express = require('express');
const cors = require('cors');
const path = require('path');
const Fingerprint = require('express-fingerprint');
const Database = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database();

app.use(cors());
app.use(express.json());

// Only serve static files in development
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static('public'));
}

// Add fingerprinting middleware
app.use(Fingerprint({
  parameters: [
    Fingerprint.useragent,
    Fingerprint.acceptHeaders,
    Fingerprint.geoip,
    function(next) {
      // Use IP address as primary identifier
      next(null, {
        'ip': this.req.ip || this.req.connection.remoteAddress
      });
    }
  ]
}));

// Initialize database connection
db.connect().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

app.get('/', (req, res) => {
  res.json({ message: 'Quantum Radio Server is running!' });
});

app.get('/api/users', async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM users", []);
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  try {
    const result = await db.run("INSERT INTO users (name, email) VALUES (?, ?)", [name, email]);
    res.json({ id: result.lastID, name, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get ratings for a specific track
app.get('/api/ratings/:trackId', async (req, res) => {
  const trackId = req.params.trackId;
  
  try {
    const rows = await db.query(
      `SELECT rating, COUNT(*) as count 
       FROM track_ratings 
       WHERE track_id = ? 
       GROUP BY rating`,
      [trackId]
    );
    
    const stats = { love: 0, happy: 0, sad: 0, angry: 0 };
    rows.forEach(row => {
      stats[row.rating] = row.count;
    });
    
    const total = stats.love + stats.happy + stats.sad + stats.angry;
    
    res.json({ stats, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's rating for a specific track
app.get('/api/ratings/:trackId/user', async (req, res) => {
  const trackId = req.params.trackId;
  const userFingerprint = req.fingerprint.hash;
  
  try {
    const row = await db.get(
      "SELECT rating FROM track_ratings WHERE track_id = ? AND user_session = ?",
      [trackId, userFingerprint]
    );
    
    res.json({ rating: row ? row.rating : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit or update a rating
app.post('/api/ratings', async (req, res) => {
  const { trackId, artist, title, album, rating } = req.body;
  const userFingerprint = req.fingerprint.hash;
  
  if (!trackId || !artist || !title || !rating) {
    return res.status(400).json({ 
      error: 'trackId, artist, title, and rating are required' 
    });
  }
  
  if (!['love', 'happy', 'sad', 'angry'].includes(rating)) {
    return res.status(400).json({ 
      error: 'Rating must be one of: love, happy, sad, angry' 
    });
  }
  
  try {
    await db.upsertRating(trackId, artist, title, album || null, rating, userFingerprint);
    
    res.json({ 
      success: true, 
      trackId, 
      rating,
      userFingerprint,
      message: 'Rating saved successfully' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a rating
app.delete('/api/ratings/:trackId/user', async (req, res) => {
  const trackId = req.params.trackId;
  const userFingerprint = req.fingerprint.hash;
  
  try {
    const result = await db.run(
      "DELETE FROM track_ratings WHERE track_id = ? AND user_session = ?",
      [trackId, userFingerprint]
    );
    
    res.json({ 
      success: true, 
      deleted: result.changes > 0,
      message: result.changes > 0 ? 'Rating deleted' : 'No rating found to delete'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});