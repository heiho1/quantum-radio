# Quantum Radio - System Architecture Diagram

## Core System Architecture

```mermaid
graph TB
    %% External Services Layer
    subgraph "☁️ External Services"
        CDN[AWS CloudFront<br/>🎵 HLS Audio Stream<br/>📊 Track Metadata API]
        GitHub[GitHub<br/>📦 Source Repository]
        Codecov[Codecov<br/>📈 Test Coverage]
    end

    %% CI/CD Layer
    subgraph "🔄 CI/CD Pipeline"
        Actions[GitHub Actions<br/>✅ Node.js 20x & 22x Tests<br/>🔒 Security Scans<br/>🐳 Docker Builds<br/>📊 Quality Gates]
    end

    %% Production Layer
    subgraph "🚀 Production (Docker Compose)"
        subgraph "Frontend Tier"
            Nginx[Nginx 1.25<br/>🌐 Web Server<br/>📁 Static Assets<br/>🔐 Security Headers<br/>⚡ Gzip & Caching]
        end
        
        subgraph "API Tier"
            NodeAPI[Node.js 22 API<br/>🚀 Express.js Server<br/>👤 User Fingerprinting<br/>🔌 REST Endpoints]
        end
        
        subgraph "Data Tier"
            PostgresDB[(PostgreSQL 16<br/>👥 Users Table<br/>⭐ Ratings Table<br/>💾 Persistent Volume)]
        end
    end

    %% Development Layer
    subgraph "💻 Development"
        LocalDev[Local Dev<br/>🔧 Node.js 20/22<br/>📂 SQLite DB<br/>🔄 Hot Reload]
        DockerDev[Docker Dev<br/>🐳 Node.js 18<br/>📁 Volume Mounts<br/>🔗 Port 3001]
    end

    %% Client Layer
    subgraph "👥 Users"
        Browser[Web Browser<br/>🎧 HLS.js Player<br/>⭐ Rating Interface<br/>📱 Responsive UI]
    end

    %% Data Flows
    Browser <==> CDN
    Browser <==> Nginx
    Nginx <==> NodeAPI
    NodeAPI <==> PostgresDB
    
    Browser -.-> LocalDev
    Browser -.-> DockerDev
    
    GitHub ==> Actions
    Actions ==> Codecov
    Actions -.-> PostgresDB

    %% Network
    Nginx -.->|Internal Network| NodeAPI
    NodeAPI -.->|Internal Network| PostgresDB

    %% Styling
    classDef external fill:#e3f2fd,stroke:#1976d2,stroke-width:2px,color:#000
    classDef cicd fill:#fce4ec,stroke:#c2185b,stroke-width:2px,color:#000
    classDef production fill:#e8f5e8,stroke:#388e3c,stroke-width:2px,color:#000
    classDef development fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000
    classDef client fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#000

    class CDN,GitHub,Codecov external
    class Actions cicd
    class Nginx,NodeAPI,PostgresDB production
    class LocalDev,DockerDev development
    class Browser client
```

## Deployment Architecture

```mermaid
graph LR
    subgraph "🏗️ Production Deployment"
        subgraph "Container: nginx:1.25-alpine"
            N1[Nginx Process<br/>Port 80/443<br/>Load Balancer]
        end
        
        subgraph "Container: node:22-alpine"
            N2[Express API<br/>Port 3000<br/>Business Logic]
        end
        
        subgraph "Container: postgres:16-alpine"
            N3[PostgreSQL<br/>Port 5432<br/>Data Storage]
        end
        
        subgraph "🔗 Docker Network"
            Network[quantum-network<br/>Internal Bridge]
        end
    end

    subgraph "💾 Persistent Volumes"
        V1[nginx.conf<br/>Web Server Config]
        V2[./public/<br/>Static Assets]
        V3[postgres_data<br/>Database Files]
        V4[init.sql<br/>Schema Setup]
    end

    %% Volume Mappings
    V1 --> N1
    V2 --> N1
    V3 --> N3
    V4 --> N3

    %% Network Connections
    N1 <-.-> Network
    N2 <-.-> Network
    N3 <-.-> Network

    %% Inter-container Communication
    N1 -->|Proxy /api/*| N2
    N2 -->|SQL Queries| N3

    classDef container fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef volume fill:#f9fbe7,stroke:#689f38,stroke-width:2px
    classDef network fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    
    class N1,N2,N3 container
    class V1,V2,V3,V4 volume
    class Network network
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant 👤 as User
    participant 🌐 as Browser
    participant ☁️ as CloudFront
    participant 🔧 as Nginx
    participant 🚀 as Node.js API
    participant 💾 as PostgreSQL

    Note over 👤,💾: Audio Streaming & Rating Flow

    👤->>🌐: Visit app
    🌐->>🔧: GET /
    🔧->>🌐: index.html + assets
    
    🌐->>☁️: Request HLS stream
    ☁️->>🌐: Audio chunks
    
    loop Every 10 seconds
        🌐->>☁️: GET metadata
        ☁️->>🌐: Current track info
    end
    
    👤->>🌐: Rate track ⭐
    🌐->>🔧: POST /api/ratings
    🔧->>🚀: Forward request
    🚀->>💾: INSERT rating
    💾->>🚀: Success
    🚀->>🔧: Response
    🔧->>🌐: Rating saved ✅
    🌐->>👤: Update UI
```

## Testing & CI Architecture

```mermaid
graph TD
    subgraph "🔬 Testing Pipeline"
        subgraph "Backend Tests"
            Jest[Jest<br/>🧪 API Tests<br/>📊 Coverage Reports<br/>🗄️ Database Tests]
        end
        
        subgraph "Frontend Tests"
            Vitest[Vitest + JSDOM<br/>🎨 Component Tests<br/>🔧 Mock APIs<br/>📱 UI Tests]
        end
        
        subgraph "Security Tests"
            Audit[npm audit<br/>🔒 Vulnerability Scan<br/>📋 Dependency Check<br/>⚠️ Security Reports]
        end
        
        subgraph "Integration Tests"
            Docker[Docker Tests<br/>🐳 Container Build<br/>🔗 API Health Check<br/>🌐 Endpoint Tests]
        end
    end

    subgraph "🎯 Test Matrix"
        Node20[Node.js 20.x<br/>LTS Support]
        Node22[Node.js 22.x<br/>Production Version]
    end

    Jest --> Node20
    Jest --> Node22
    Vitest --> Node20
    Vitest --> Node22
    
    Audit --> Security[Security Report]
    Docker --> Health[Health Status]
    
    Node20 --> Results{All Tests Pass?}
    Node22 --> Results
    Security --> Results
    Health --> Results
    
    Results -->|✅ Success| Deploy[🚀 Deploy]
    Results -->|❌ Failure| Block[🚫 Block Deployment]

    classDef test fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef node fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef decision fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    classDef success fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef failure fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    
    class Jest,Vitest,Audit,Docker test
    class Node20,Node22 node
    class Results decision
    class Deploy success
    class Block failure
```

## Quick Reference

### 🚀 Production Stack
- **Frontend**: Nginx 1.25 (Alpine) - Port 80/443
- **Backend**: Node.js 22 (Alpine) - Port 3000
- **Database**: PostgreSQL 16 (Alpine) - Port 5432
- **Orchestration**: Docker Compose with internal networking

### 💻 Development Options
- **Local**: Node.js 20/22 + SQLite + Hot reload
- **Docker**: Node.js 18 + Volume mounts + Port 3001

### 🔬 Testing Matrix
- **Unit Tests**: Jest (Backend) + Vitest (Frontend)
- **Node Versions**: 20.x & 22.x compatibility testing
- **Security**: npm audit with vulnerability reporting
- **Integration**: Docker container validation

### 📦 Key Components
- **Audio Streaming**: HLS.js + AWS CloudFront CDN
- **User System**: Anonymous fingerprinting (IP + User-Agent)
- **Rating System**: Emoji-based track ratings (😍😊😢😠)
- **Database**: Users & track_ratings tables with constraints

### 🛠️ Management Commands
```bash
# Development
make dev          # Local development
make dev-docker   # Docker development
make test-all     # Complete test suite

# Production
make prod-docker  # Full production stack
make health       # Service health check
make logs-prod    # Production monitoring

# Utilities
make clean        # Cleanup resources
make help         # Show all commands
```