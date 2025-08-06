const sqlite3 = require('sqlite3').verbose();

class Database {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.client = null;
    this.db = null;
    this.pgClient = null; // Will hold the PostgreSQL Client class if available
  }

  async connect() {
    if (this.isProduction) {
      // PostgreSQL for production - conditionally require
      try {
        const { Client } = require('pg');
        this.pgClient = Client;
        
        this.client = new Client({
          host: process.env.DB_HOST || 'postgres',
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_NAME || 'quantum_radio',
          user: process.env.DB_USER || 'quantum_user',
          password: process.env.DB_PASSWORD || 'quantum_password',
        });

        await this.client.connect();
        console.log('Connected to PostgreSQL database.');
        await this.initializeSchema();
      } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
          console.error('PostgreSQL driver (pg) not found. Install with: npm install pg');
          console.error('In production, pg is required but not installed.');
          throw new Error('PostgreSQL driver missing - install pg package for production use');
        }
        console.error('Error connecting to PostgreSQL:', err.message);
        throw err;
      }
    } else {
      // SQLite for development
      this.db = new sqlite3.Database('./database.db', (err) => {
        if (err) {
          console.error('Error opening SQLite database:', err.message);
          throw err;
        } else {
          console.log('Connected to SQLite database.');
          this.initializeSchema();
        }
      });
    }
  }

  async initializeSchema() {
    if (this.isProduction) {
      // PostgreSQL schema
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.client.query(`
        CREATE TABLE IF NOT EXISTS track_ratings (
          id SERIAL PRIMARY KEY,
          track_id TEXT NOT NULL,
          artist TEXT NOT NULL,
          title TEXT NOT NULL,
          album TEXT,
          rating TEXT NOT NULL CHECK(rating IN ('love', 'happy', 'sad', 'angry')),
          user_session TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(track_id, user_session)
        )
      `);

      await this.client.query(`
        CREATE INDEX IF NOT EXISTS idx_track_ratings_track_id ON track_ratings(track_id)
      `);
      
      await this.client.query(`
        CREATE INDEX IF NOT EXISTS idx_track_ratings_user_session ON track_ratings(user_session)
      `);
    } else {
      // SQLite schema
      this.db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      this.db.run(`CREATE TABLE IF NOT EXISTS track_ratings (
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

      this.db.run(`CREATE INDEX IF NOT EXISTS idx_track_ratings_track_id ON track_ratings(track_id)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_track_ratings_user_session ON track_ratings(user_session)`);
    }
  }

  async query(sql, params = []) {
    if (this.isProduction) {
      try {
        const result = await this.client.query(sql, params);
        return result.rows;
      } catch (err) {
        throw err;
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    }
  }

  async get(sql, params = []) {
    if (this.isProduction) {
      try {
        const result = await this.client.query(sql, params);
        return result.rows[0] || null;
      } catch (err) {
        throw err;
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        });
      });
    }
  }

  async run(sql, params = []) {
    if (this.isProduction) {
      try {
        const result = await this.client.query(sql, params);
        return {
          changes: result.rowCount,
          lastID: result.rows[0]?.id
        };
      } catch (err) {
        throw err;
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              changes: this.changes,
              lastID: this.lastID
            });
          }
        });
      });
    }
  }

  async upsertRating(trackId, artist, title, album, rating, userSession) {
    if (this.isProduction) {
      // PostgreSQL UPSERT using ON CONFLICT
      const sql = `
        INSERT INTO track_ratings (track_id, artist, title, album, rating, user_session)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (track_id, user_session) 
        DO UPDATE SET 
          rating = EXCLUDED.rating,
          created_at = CURRENT_TIMESTAMP
        RETURNING id
      `;
      return await this.run(sql, [trackId, artist, title, album, rating, userSession]);
    } else {
      // SQLite INSERT OR REPLACE
      const sql = `
        INSERT OR REPLACE INTO track_ratings 
        (track_id, artist, title, album, rating, user_session) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      return await this.run(sql, [trackId, artist, title, album, rating, userSession]);
    }
  }

  async close() {
    if (this.isProduction && this.client) {
      await this.client.end();
    } else if (this.db) {
      this.db.close();
    }
  }
}

module.exports = Database;