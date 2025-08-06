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
|-- database.db                   # SQLite database (development only)
|-- database.js                   # Database abstraction layer (SQLite/PostgreSQL)
|-- docker-compose.yml            # Docker orchestration configuration (dev/simple prod)
|-- docker-compose.prod.yml       # Production Docker orchestration (Nginx + PostgreSQL)
|-- init.sql                      # PostgreSQL database initialization script
|-- nginx.conf                    # Nginx configuration for production
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
- Database abstraction layer supporting SQLite (dev) and PostgreSQL (production)
- Database tables:
  - `users`: basic user management (id, name, email, created_at)
  - `track_ratings`: track ratings with user sessions (track_id, rating, user_session, etc.)
- API endpoints:
  - `GET /api/users` - list users
  - `POST /api/users` - create user
  - `GET /api/ratings/:trackId` - get rating stats for track
  - `GET /api/ratings/:trackId/user` - get user's rating for track
  - `POST /api/ratings` - submit/update rating
  - `DELETE /api/ratings/:trackId/user` - delete user's rating
- Static file serving disabled in production (handled by Nginx)

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
# Development: Start simple production container on port 3000
npm run docker:up

# Development: Start development container on port 3001 with hot reload
npm run docker:up:dev

# Production: Start full production stack (Nginx + PostgreSQL + API)
npm run docker:up:prod

# Stop containers
npm run docker:down

# Stop production stack
npm run docker:down:prod

# View container logs
npm run docker:logs

# View production stack logs
npm run docker:logs:prod
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

- **Backend**: Express.js, SQLite3 (dev), PostgreSQL (prod), CORS, express-fingerprint, dotenv
- **Frontend**: Vanilla HTML/CSS/JavaScript, HLS.js
- **Audio**: HLS streaming with external metadata API
- **Styling**: CSS custom properties, glassmorphism design, Montserrat + Open Sans fonts
- **Infrastructure**: Docker, Docker Compose, Nginx (production), PostgreSQL (production)
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
- PostgreSQL driver (`pg`) is optional - only required for production deployments
- Development uses SQLite and doesn't require PostgreSQL dependencies

## Docker Deployment

The application supports multiple Docker deployment configurations:

### Production Deployment (`docker-compose.prod.yml`)
- **Architecture**: Multi-container setup with Nginx, Node.js API, and PostgreSQL
- **Frontend**: Nginx serves static files with compression, caching, and rate limiting
- **Backend**: Node.js API container (port 3000, internal network)
- **Database**: PostgreSQL 16 with persistent volume storage
- **Port**: External access on port 80 (Nginx)
- **Security**: Non-root users, network isolation, security headers
- **Health Checks**: All services monitored with automatic health checks

### Development Environment (`docker-compose.yml`)
- **Development**: `quantum-radio-dev` service on port 3001 with hot reload
- **Simple Production**: `quantum-radio-prod` service on port 3000 with SQLite
- **Database**: SQLite for development, volume-mounted for persistence
- **Hot Reload**: Development container supports live code changes

### Database Configuration
- **Development**: SQLite database (`database.db`) with simple setup (no PostgreSQL required)
- **Production**: PostgreSQL with automatic initialization via `init.sql`
- **Abstraction**: Database layer (`database.js`) supports both SQLite and PostgreSQL
- **Environment**: Database selection based on `NODE_ENV` variable
- **Dependencies**: PostgreSQL driver (`pg`) conditionally loaded only in production

### Nginx Configuration
- **Static Assets**: Serves frontend files with optimized caching headers
- **API Proxy**: Routes `/api/*` requests to backend with rate limiting
- **Security**: Includes security headers and HTTPS-ready configuration
- **Performance**: Gzip compression and efficient static file serving