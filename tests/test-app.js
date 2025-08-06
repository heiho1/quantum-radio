const express = require('express');
const cors = require('cors');
const Fingerprint = require('express-fingerprint');
const { createTestDatabase } = require('./test-db');

async function createTestApp() {
  const app = express();
  const db = await createTestDatabase();

  app.use(cors());
  app.use(express.json());
  
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

  // Define API routes for testing
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

  // Store db reference on app for cleanup
  app.testDb = db;
  
  return app;
}

module.exports = { createTestApp };