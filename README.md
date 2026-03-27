# wots-platform
War of the Sphinx — PWA platform with Claude-powered world assistant, Firebase hosting, and automated cntent pipeline

## Architecture

```
wots-platform/
├── frontend/          # React + Vite PWA
│   ├── src/
│   │   ├── pages/     # Home, Chat, Lore pages
│   │   ├── api.ts     # API client
│   │   └── types.ts   # Shared types
│   └── public/        # PWA manifest, service worker
├── functions/         # Firebase Cloud Functions
│   └── src/
│       ├── index.ts       # API endpoints
│       ├── assistant.ts   # Claude-powered Sphinx
│       ├── pipeline.ts    # Content generation pipeline
│       └── types.ts       # Shared types
├── tests/             # Integration tests
├── firebase.json      # Firebase configuration
└── firestore.rules    # Firestore security rules
```

## Getting Started

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..
cd functions && npm install && cd ..

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Start development
npm run dev

# Run tests
npm test

# Deploy
npm run deploy
```

## Key Features

- **The Sphinx** — Claude-powered world assistant that guides players with riddles and wisdom
- **Content Pipeline** — Automated generation of lore, quests, characters, and locations
- **PWA** — Installable progressive web app with offline support
- **Firebase** — Hosted on Firebase with Cloud Functions backend and Firestore database
