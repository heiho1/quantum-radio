# Quantum Radio 📻

A modern streaming radio web application that delivers high-quality audio with real-time metadata, user ratings, and an elegant glassmorphism design.

![Quantum Radio Logo](QuantumRadioLogo.png)

## Features

- 🎵 **High-Quality Audio Streaming** - HLS streaming for crystal-clear audio delivery
- 🎤 **Real-Time Metadata** - Live track information, artist details, and album artwork
- 💝 **Interactive Rating System** - Rate tracks with emoji reactions (😍😊😢😠)
- 📋 **Recently Played Tracks** - Keep track of your listening history
- 🎨 **Modern UI Design** - Glassmorphism effects with the Quantum Radio brand palette
- 👤 **Anonymous User System** - Fingerprint-based user identification for ratings
- 📱 **Responsive Design** - Works seamlessly across desktop and mobile devices

## Technology Stack

### Frontend
- **HTML5/CSS3/JavaScript** - Vanilla web technologies with ES6 modules
- **HLS.js** - HTTP Live Streaming support
- **CSS Custom Properties** - Modern styling with glassmorphism effects
- **Typography** - Montserrat & Open Sans fonts

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **SQLite3** - Lightweight database for user ratings
- **CORS** - Cross-origin resource sharing
- **express-fingerprint** - Anonymous user identification

### External Services
- **CloudFront CDN** - Audio streaming via `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
- **External Metadata API** - Real-time track information

## Project Structure

```
quantum-radio/
├── public/                    # Frontend assets
│   ├── index.html            # Single-page application
│   ├── css/                  # Modular stylesheets
│   │   ├── variables.css     # Color palette & custom properties
│   │   ├── base.css          # Base styles & typography
│   │   ├── header.css        # Header & branding
│   │   ├── widgets.css       # Metadata & track widgets
│   │   └── ratings.css       # Rating system UI
│   └── js/                   # Frontend JavaScript modules
│       ├── config.js         # Configuration constants
│       ├── dom.js            # DOM element references
│       ├── metadata.js       # Track metadata management
│       ├── ratings.js        # Rating system functionality
│       ├── audio.js          # HLS streaming & events
│       └── main.js           # Application initialization
├── server.js                 # Express.js backend server
├── database.db               # SQLite database
├── package.json              # Project configuration
└── QuantumRadio_Style_Guide.txt # Brand guidelines
```

## Installation & Setup

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/heiho1/quantum-radio.git
   cd quantum-radio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Production Deployment

```bash
npm start
```

The server runs on port 3000 by default (configurable via `PORT` environment variable).

## API Endpoints

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create a new user

### Ratings
- `GET /api/ratings/:trackId` - Get rating statistics for a track
- `GET /api/ratings/:trackId/user` - Get current user's rating for a track
- `POST /api/ratings` - Submit or update a rating
- `DELETE /api/ratings/:trackId/user` - Remove user's rating

## Database Schema

### Users Table
```sql
users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Track Ratings Table
```sql
track_ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id TEXT NOT NULL,
  rating TEXT CHECK(rating IN ('love', 'happy', 'sad', 'angry')),
  user_session TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(track_id, user_session)
)
```

## Design System

Quantum Radio follows a carefully crafted brand identity:

### Color Palette
- **Mint**: `#D8F2D5` - Logo circle, background fills, accents
- **Forest Green**: `#1F4E23` - Primary buttons, headings
- **Charcoal**: `#231F20` - Body text, icon outlines
- **Cream**: `#F5EADA` - Secondary backgrounds, cards

### Typography
- **Headings**: Montserrat (weights: 500-700)
- **Body Text**: Open Sans (weight: 400)

## Development

### Available Scripts

```bash
# Development server with auto-reload
npm run dev

# Production server
npm start

# Install dependencies
npm install
```

### Code Architecture

The frontend follows a modular architecture:
- **ES6 Modules** - Clear separation of concerns
- **Event-Driven** - Audio events trigger UI updates
- **Polling System** - Metadata fetched every 10 seconds
- **State Management** - Centralized in respective modules

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- Audio streaming powered by CloudFront CDN
- UI design inspired by modern glassmorphism trends
- Built with love for high-quality audio experiences