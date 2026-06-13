# Duet: Accessibility-First Private Couple Space

Duet is a premium, fully-accessible private space designed exclusively for two people. It combines real-time messaging (WhatsApp/Telegram style), shared milestone tracking, photo/video archives (Google Photos style), and high-fidelity real-time WebRTC audio/video calling.

---

## Key Features

1. **Private Linking**: Users join the space by sharing a secure 6-character invitation code. A database constraint ensures each couple room is capped at exactly two users.
2. **Accessible by Design**:
   - **High Contrast Theme**: Pure dark and high-contrast color scheme.
   - **Text Scaling**: Interactive controls to instantly scale typography.
   - **Screen Reader Announcements**: Screen readers verbally announce new messages and connection statuses via `aria-live` containers.
   - **Text-To-Speech Reader**: Optional hover/focus sound trigger to read elements aloud.
3. **WebRTC Peer Connection**: Low-latency direct audio/video calling broker powered by standard peer-to-peer data flows.
4. **Interactive Chat & Voice Recording**: Send text, images, and audio voice messages (complete with automatic transcript captions for accessibility support).
5. **Anniversary Tracking**: Milestone counter that tracks and celebrates relationship duration in days.

---

## Folder Structure

```
duet/
├── README.md               # Main instructions
├── server/                 # Express backend & database
│   ├── index.js            # Main entry point & WebRTC/Socket.io signalling
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma   # SQLite DB schema definitions
│   │   └── dev.db          # Database file (generated on migration)
│   ├── routes/             # REST API routers
│   │   ├── auth.js
│   │   ├── messages.js
│   │   ├── memories.js
│   │   └── accessibility.js
│   ├── middleware/         # Protection & file uploader
│   │   └── auth.js
│   └── uploads/            # Local directory for chat & memory uploads
└── client/                 # React frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx         # Handles state, routing, and WebSocket hookups
        ├── index.css       # Layout styles & accessibility theme modes
        ├── context/
        │   └── AccessibilityContext.jsx
        └── components/
            ├── Chat.jsx
            ├── Memories.jsx
            ├── CallOverlay.jsx
            └── Settings.jsx
```

---

## Database Schema Model (Prisma)

- **User**: Holds email, hash, pair invite code, avatar, and references their Couple space.
- **Couple**: Connects exactly two users; stores anniversary dates and theme details.
- **AccessibilitySettings**: User preferences (high contrast, text scale, subtitles, TTS).
- **Message**: Chats, images, or voice files.
- **Memory**: Timestamps and file links of couple moments.
- **Call**: Call records (duration, type, timestamp).

---

## Production Deployment Instructions

### Prerequisites
- Node.js (v18+)
- npm

### 1. Configure Production Environment Variables
Create a `.env` file inside `server/` folder:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="generate-a-secure-random-key-here"
NODE_ENV=production
```

### 2. Build the Application
Run these commands to prepare and build the assets:
```bash
# Build Frontend assets
cd client
npm install
npm run build

# Install Backend dependencies and sync DB
cd ../server
npm install
npx prisma migrate deploy
```

### 3. Start Production Server
```bash
cd server
npm start
```
The application will serve the backend REST APIs, Socket.IO connections, WebRTC signaling protocols, and the built React frontend on the configured `PORT` (default: 5000).

---

## Running in Development Mode

To run both client and server hot-reloading for local testing:

### Start Backend (Port 5000)
```bash
cd server
npm run dev
```

### Start Frontend (Port 5173)
```bash
cd client
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
