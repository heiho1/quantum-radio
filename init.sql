-- PostgreSQL initialization script for Quantum Radio
-- This script runs automatically when the PostgreSQL container starts

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create track_ratings table
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
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_track_ratings_track_id ON track_ratings(track_id);
CREATE INDEX IF NOT EXISTS idx_track_ratings_user_session ON track_ratings(user_session);
CREATE INDEX IF NOT EXISTS idx_track_ratings_rating ON track_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Grant necessary permissions to the application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO quantum_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO quantum_user;