const sqlite3 = require('sqlite3').verbose();

function createTestDatabase() {
  return new Promise((resolve, reject) => {
    // Create in-memory database for testing
    const db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        reject(err);
        return;
      }

      // Create tables
      db.serialize(() => {
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
        )`, (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          db.run(`CREATE INDEX IF NOT EXISTS idx_track_ratings_track_id ON track_ratings(track_id)`);
          db.run(`CREATE INDEX IF NOT EXISTS idx_track_ratings_user_session ON track_ratings(user_session)`, (err) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(db);
          });
        });
      });
    });
  });
}

function closeTestDatabase(db) {
  return new Promise((resolve) => {
    db.close(() => {
      resolve();
    });
  });
}

// Clear and seed test data
function seedTestData(db) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Clear existing data first
      db.run('DELETE FROM track_ratings', (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        const stmt = db.prepare(`INSERT INTO track_ratings 
          (track_id, artist, title, album, rating, user_session) 
          VALUES (?, ?, ?, ?, ?, ?)`);
        
        // Add test ratings
        stmt.run('track1', 'Artist 1', 'Song 1', 'Album 1', 'love', 'user1');
        stmt.run('track1', 'Artist 1', 'Song 1', 'Album 1', 'happy', 'user2');
        stmt.run('track2', 'Artist 2', 'Song 2', 'Album 2', 'sad', 'user1');
        
        stmt.finalize((err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  });
}

module.exports = {
  createTestDatabase,
  closeTestDatabase,
  seedTestData
};