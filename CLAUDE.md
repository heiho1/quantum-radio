# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quantum Radio is a streaming radio web application that plays high-quality audio with real-time metadata, track ratings, and recently played tracks. It consists of:

- **Frontend**: Single-page HTML application with vanilla JavaScript
- **Backend**: Express.js server with SQLite database
- **Audio**: HLS streaming with real-time metadata fetching

## File Structure

```
quantum-radio/
|-- .dockerignore                 # Docker ignore rules
|-- .gitignore                    # Git ignore rules (excludes node_modules, logs, etc.)
|-- CLAUDE.md                     # Project guidance for Claude Code
|-- Dockerfile                    # Production Docker container
|-- Dockerfile.dev                # Development Docker container
|-- QuantumRadioLogo.png          # Brand logo asset
|-- QuantumRadio_Style_Guide.txt  # Brand and UI style guidelines
|-- database.db                   # SQLite database (committed artifact)
|-- docker-compose.yml            # Docker orchestration configuration
|-- node_modules/                 # npm dependencies (gitignored)
|-- package-lock.json             # npm lockfile
|-- package.json                  # Project config and dependencies
|-- server.js                     # Express.js server and API routes
|-- stream_URL.txt               # HLS stream URL reference
`-- public/
    |-- QuantumRadioLogo.png      # Logo for web serving
    |-- index.html                # Single-page application frontend
    |-- css/
    |   |-- variables.css         # CSS custom properties and color palette
    |   |-- base.css              # Base styles, layout, and typography
    |   |-- header.css            # Header brand and logo styling
    |   |-- widgets.css           # Metadata, tracks, and visualizer widgets
    |   `-- ratings.css           # Rating system buttons and stats
    `-- js/
        |-- config.js             # Application configuration and constants
        |-- dom.js                # DOM element references
        |-- metadata.js           # Metadata fetching and track management
        |-- ratings.js            # Rating system functionality
        |-- audio.js              # HLS audio streaming and events
        `-- main.js               # Application initialization and entry point
```

## Architecture

### Frontend (`public/`)
- **HTML**: Single-page application (`index.html`) with modular CSS and JavaScript
- **CSS**: Organized into separate files (variables, base, header, widgets, ratings)
- **JavaScript**: ES6 modules with clear separation of concerns:
  - `config.js`: Application configuration and constants
  - `dom.js`: DOM element references
  - `metadata.js`: Track metadata fetching and management
  - `ratings.js`: Rating system functionality
  - `audio.js`: HLS audio streaming and events
  - `main.js`: Application initialization
- Uses HLS.js for audio streaming (`https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`)
- Fetches metadata from external endpoint every 10 seconds
- User fingerprinting for anonymous ratings via express-fingerprint
- Features: audio player, track ratings (😍😊😢😠), recently played tracks, album covers

### Backend (`server.js`)
- Express.js server on port 3000 (configurable via PORT env var)
- SQLite database (`database.db`) with two tables:
  - `users`: basic user management (id, name, email, created_at)
  - `track_ratings`: track ratings with user sessions (track_id, rating, user_session, etc.)
- API endpoints:
  - `GET /api/users` - list users
  - `POST /api/users` - create user
  - `GET /api/ratings/:trackId` - get rating stats for track
  - `GET /api/ratings/:trackId/user` - get user's rating for track
  - `POST /api/ratings` - submit/update rating
  - `DELETE /api/ratings/:trackId/user` - delete user's rating

### Database Schema
- Automatic table creation on startup
- User identification via fingerprint hash (IP, user-agent, headers)
- Rating constraints: 'love', 'happy', 'sad', 'angry'
- Unique constraint on track_id + user_session pairs

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests
npm test
```

### Docker Development

#### Using Docker Compose (Recommended)
```bash
# Start production container on port 3000
npm run docker:up

# Start development container on port 3001 with hot reload
npm run docker:up:dev

# Stop all containers
npm run docker:down

# View container logs
npm run docker:logs
```

#### Using Docker Commands Directly
```bash
# Build production image
npm run docker:build

# Build development image
npm run docker:build:dev

# Run production container
npm run docker:run

# Run development container with volume mounting
npm run docker:run:dev

# Clean up unused Docker resources
npm run docker:clean
```

## Technology Stack

- **Backend**: Express.js, SQLite3, CORS, express-fingerprint, dotenv
- **Frontend**: Vanilla HTML/CSS/JavaScript, HLS.js
- **Audio**: HLS streaming with external metadata API
- **Styling**: CSS custom properties, glassmorphism design, Montserrat + Open Sans fonts
- **Containerization**: Docker, Docker Compose
- **Testing**: Jest (backend), Vitest (frontend)

## Design System

The application follows the Quantum Radio brand guidelines (`QuantumRadio_Style_Guide.txt`):
- **Colors**: Mint (#D8F2D5), Forest Green (#1F4E23), Charcoal (#231F20), Cream (#F5EADA)
- **Typography**: Montserrat for headings, Open Sans for body text
- **Visual Style**: Dark metallic gradient background with glassmorphism effects

## Development Notes

- Test suite configured with Jest (backend) and Vitest (frontend)
- External dependencies: HLS stream and metadata from CloudFront CDN
- Uses hardcoded stream URL in both `stream_URL.txt` and frontend code

## Docker Deployment

The application supports both development and production Docker environments:

### Production Deployment
- **Image**: Built from `Dockerfile` using Node.js 18 Alpine
- **Port**: 3000 (configurable via PORT env var)
- **Database**: SQLite database mounted as volume (`./database.db:/app/database.db`)
- **Security**: Runs as non-root user (`quantum:nodejs`)
- **Health Check**: Automated health monitoring on `/api/users` endpoint

### Development Environment
- **Image**: Built from `Dockerfile.dev` with development dependencies
- **Port**: 3001 (mapped from container port 3000)
- **Hot Reload**: Volume mounting enables live code changes
- **Database**: Shared SQLite database with host system

### Docker Compose Configuration
- **Production**: `quantum-radio-prod` service on port 3000
- **Development**: `quantum-radio-dev` service on port 3001 (profile: dev)
- **Volumes**: Database persistence and development code mounting
- **Health Checks**: Automatic container health monitoring