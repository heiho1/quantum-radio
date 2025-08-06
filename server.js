const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const Fingerprint = require('express-fingerprint');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS track_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id TEXT NOT NULL,
      artist TEXT NOT NULL,
      title TEXT NOT NULL,
      album TEXT,
      rating TEXT NOT NULL CHECK(rating IN ('love', 'happy', 'sad', 'angry')),
      user_session TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(track_id, user_session)
    )`);
    
    db.run(`CREATE INDEX IF NOT EXISTS idx_track_ratings_track_id ON track_ratings(track_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_track_ratings_user_session ON track_ratings(user_session)`);
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Quantum Radio Server is running!' });
});

app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ users: rows });
  });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  db.run("INSERT INTO users (name, email) VALUES (?, ?)", [name, email], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name, email });
  });
});

// Get ratings for a specific track
app.get('/api/ratings/:trackId', (req, res) => {
  const trackId = req.params.trackId;
  
  db.all(
    `SELECT rating, COUNT(*) as count 
     FROM track_ratings 
     WHERE track_id = ? 
     GROUP BY rating`,
    [trackId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const stats = { love: 0, happy: 0, sad: 0, angry: 0 };
      rows.forEach(row => {
        stats[row.rating] = row.count;
      });
      
      const total = stats.love + stats.happy + stats.sad + stats.angry;
      
      res.json({ stats, total });
    }
  );
});

// Get user's rating for a specific track
app.get('/api/ratings/:trackId/user', (req, res) => {
  const trackId = req.params.trackId;
  const userFingerprint = req.fingerprint.hash;
  
  db.get(
    "SELECT rating FROM track_ratings WHERE track_id = ? AND user_session = ?",
    [trackId, userFingerprint],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({ rating: row ? row.rating : null });
    }
  );
});

// Submit or update a rating
app.post('/api/ratings', (req, res) => {
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
  
  // Use INSERT OR REPLACE to handle updates
  db.run(
    `INSERT OR REPLACE INTO track_ratings 
     (track_id, artist, title, album, rating, user_session) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [trackId, artist, title, album || null, rating, userFingerprint],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({ 
        success: true, 
        trackId, 
        rating,
        userFingerprint,
        message: 'Rating saved successfully' 
      });
    }
  );
});

// Delete a rating
app.delete('/api/ratings/:trackId/user', (req, res) => {
  const trackId = req.params.trackId;
  const userFingerprint = req.fingerprint.hash;
  
  db.run(
    "DELETE FROM track_ratings WHERE track_id = ? AND user_session = ?",
    [trackId, userFingerprint],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({ 
        success: true, 
        deleted: this.changes > 0,
        message: this.changes > 0 ? 'Rating deleted' : 'No rating found to delete'
      });
    }
  );
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