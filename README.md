# 🐺 Node Wolvesville - Backend Server

The backend server for the Wolvesville multiplayer game. Built with Node.js, Express, Socket.IO, and MongoDB to handle real-time game logic, room management, and player interactions.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-black?style=flat-square&logo=express)](https://expressjs.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-green?style=flat-square&logo=socket.io)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.13-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)

## 🎮 About

This is the **server-side** application that powers the Next Wolvesville game. It manages all game logic, real-time communication between players, room creation and management, user authentication, and persistent data storage.

### Key Responsibilities

- 🔄 **Real-time Game Logic** - Handles day/night cycles, voting, and role actions
- 🎭 **Role Management** - Implements unique abilities for 15+ game roles
- 🏠 **Room Management** - Creates and manages game lobbies
- 👥 **User System** - Authentication with guest and registered users
- 🔌 **WebSocket Server** - Real-time bidirectional communication
- 💾 **Data Persistence** - MongoDB for users, roles, and teams
- 🤖 **AI Players** - CPU-controlled players with automated actions

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- MongoDB instance (local or cloud)
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone https://github.com/DylanP97/node-wolvesville.git
cd node-wolvesville
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
```bash
# Create a .env file in the root directory
cp .env.example .env
# Edit the .env file with your configuration
```

4. Configure environment variables in `.env`:
```env
# Server Configuration
PORT=3001

# MongoDB Connection
MONGODB_URL=mongodb://localhost:27017/wolvesville
# or use MongoDB Atlas
# MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/wolvesville

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# JWT Secret (generate a random secure string)
JWT_SECRET=your_super_secret_jwt_key_here

# Cookie Settings
COOKIE_SECRET=your_cookie_secret_here
```

5. Start the server
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001` (or your configured PORT).

## 📁 Project Structure

```
node-wolvesville/
├── controllers/           # Request handlers for API routes
├── gameActions/          # Game role action implementations
│   ├── cupid.js         # Cupid role logic
│   ├── doctor.js        # Doctor healing logic
│   ├── gunner.js        # Gunner shooting logic
│   ├── jailer.js        # Jailer arrest/execute logic
│   ├── pyro.js          # Arsonist burning logic
│   ├── seer.js          # Seer reveal logic
│   ├── sk.js            # Serial killer logic
│   ├── vote.js          # Voting system logic
│   ├── witch.js         # Witch potion logic
│   ├── wolfSeer.js      # Wolf Seer logic
│   └── ...              # Other role implementations
├── lib/                 # Utility functions and helpers
├── middleware/          # Express middleware (auth, validation)
├── models/              # MongoDB schemas
│   ├── user.js         # User and GuestUser models
│   ├── roles.js        # Game roles model
│   └── teams.js        # Teams model
├── routes/              # API route definitions
│   ├── user.js         # User authentication routes
│   ├── roles.js        # Game roles routes
│   └── teams.js        # Teams routes
├── index.js             # Express app configuration
├── server.js            # HTTP server & Socket.IO setup
├── socketManager.js     # Socket.IO event handlers
├── inGameEmits.js       # Game state emission utilities
├── serverStore.js       # In-memory game state store
├── package.json
└── README.md
```

## 🎯 Core Features

### Game State Management

The server maintains real-time game state including:
- Active rooms and their configurations
- Connected players and their socket connections
- Current game phase (day/night/voting)
- Player roles, statuses (alive/dead), and actions
- Vote counts and game history

### Socket.IO Events

**Client → Server Events:**
- `connection` - Player connects to server
- `create-room` - Create a new game room
- `join-room` - Join an existing room
- `leave-room` - Leave current room
- `start-game` - Start the game (room creator)
- `player-action` - Perform role-specific action
- `vote` - Vote against a player
- `chat-message` - Send chat message
- `disconnect` - Player disconnects

**Server → Client Events:**
- `room-created` - Room successfully created
- `room-joined` - Successfully joined room
- `room-update` - Room state changed
- `game-started` - Game has begun
- `phase-change` - Game phase changed
- `player-died` - Player was eliminated
- `game-over` - Game ended with winner
- `chat-message` - Broadcast chat message
- `error` - Error occurred

### API Endpoints

#### User Routes (`/api/user`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /guest` - Create guest account
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /logout` - Logout user

#### Roles Routes (`/api/roles`)
- `GET /` - Get all available roles
- `GET /:id` - Get specific role details

#### Teams Routes (`/api/teams`)
- `GET /` - Get all teams (Village, Wolves, Solo)

## 🎭 Implemented Game Roles

The server implements complete logic for these roles:

**Village Team:**
- 👁️ **Seer** - Reveals player identities at night
- 👩‍⚕️ **Doctor** - Heals one player per night
- 🔫 **Gunner** - Can shoot during the day (limited bullets)
- 👮‍♂️ **Jailer** - Arrests and can execute prisoners
- 🏹 **Cupid** - Creates lovers at start of game
- 👔 **Captain** - Vote counts double (revealed publicly)
- 👨 **Villager** - No special ability
- 😈 **Cursed Villager** - Turns into wolf if targeted
- 🪦 **Grave Robber** - Steals role from dead player

**Wolf Team:**
- 🐺 **Werewolf** - Votes to kill villagers at night
- 🐺🔍 **Wolf Seer** - Reveals roles to wolf team
- 🐺👶 **Junior Wolf** - Becomes wolf when adult wolves die

**Solo Players:**
- 🤡 **Fool** - Wins if voted out by village
- 🔪 **Serial Killer** - Kills every night, immune to wolves
- 🔥 **Arsonist (Pyro)** - Douses and burns players
- 😱 **Nightmare** - Haunts players causing chaos

**Special Roles:**
- 🧙‍♀️ **Witch** - Has one heal and one poison potion

## 🔧 Configuration

### MongoDB Models

**User Schema:**
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  avatar: Object,
  createdAt: Date
}
```

**GuestUser Schema:**
```javascript
{
  username: String,
  avatar: Object,
  sessionId: String,
  createdAt: Date
}
```

**Role Schema:**
```javascript
{
  name: String,
  team: String,
  description: String,
  status: String,
  abilities: [String]
}
```

### Server Store Structure

The in-memory store maintains:
```javascript
{
  connectedUsers: Map<socketId, userData>,
  rooms: Map<roomId, {
    id: String,
    name: String,
    creator: Object,
    players: Array,
    gameStarted: Boolean,
    currentPhase: String,
    dayCount: Number,
    gameState: Object
  }>
}
```

## 🛠️ Built With

### Core Technologies
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

### Authentication & Security
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT token generation/verification
- **cookie-parser** - Cookie parsing middleware
- **validator** - Input validation

### Utilities
- **dotenv** - Environment variable management
- **cors** - Cross-origin resource sharing
- **lodash** - Utility functions
- **uuid** - Unique ID generation
- **unique-names-generator** - Random name generation

### Development
- **nodemon** - Auto-restart on file changes

## 📝 Scripts

```bash
# Development
npm run dev        # Start server with nodemon (auto-reload)

# Production
npm start          # Start server in production mode
```

## 🎮 Game Flow

1. **Connection Phase**
   - Players connect via Socket.IO
   - Guest or registered user authentication
   - Join lobby or create room

2. **Room Setup**
   - Room creator configures game settings
   - Players join and select preferred roles
   - AI players fill remaining slots

3. **Game Start**
   - Roles are assigned randomly or by preference
   - Commencement night - special role setup
   - Game loop begins

4. **Game Loop**
   - **Nighttime**: Roles perform night actions
   - **Night Results**: Actions are resolved and announced
   - **Daytime**: Players discuss in chat
   - **Vote Time**: Players vote to eliminate someone
   - **Vote Results**: Eliminated player revealed
   - Repeat until win condition

5. **Game End**
   - Check win conditions after each phase
   - Announce winners
   - Return to lobby

## 🐛 Error Handling

The server implements comprehensive error handling:
- Invalid player actions
- Disconnection handling
- Room state validation
- Authentication errors
- Database connection issues

## 🔐 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- HTTP-only cookies
- CORS configuration
- Input validation and sanitization
- Guest user cleanup on server restart

## 🚀 Deployment

### Environment Setup

For production deployment, ensure you set:
```env
NODE_ENV=production
PORT=3001
MONGODB_URL=your_production_mongodb_url
CLIENT_URL=https://your-client-domain.com
JWT_SECRET=strong_random_secret
```

### Recommended Platforms
- **Render** - Easy Node.js deployment
- **Railway** - Simple deployment with MongoDB addon
- **Heroku** - Traditional PaaS
- **DigitalOcean** - VPS with full control
- **AWS/Google Cloud** - Scalable cloud infrastructure

### MongoDB Options
- **MongoDB Atlas** - Cloud-hosted MongoDB (recommended)
- **Local MongoDB** - For development
- **Docker** - Containerized MongoDB

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is a personal implementation inspired by the game Wolvesville. Please check [Wolvesville's official website](https://wolvesville.com/) for the original game.

## 👨‍💻 Author

**DylanP97**
- GitHub: [@DylanP97](https://github.com/DylanP97)
- Portfolio: [d97-portfolio.vercel.app](https://d97-portfolio.vercel.app)

## 🔗 Related Repositories

- **Frontend/Client**: [next-wolvesville](https://github.com/DylanP97/next-wolvesville)

## 🙏 Acknowledgments

- Inspired by [Wolvesville](https://wolvesville.com/)
- Socket.IO for excellent real-time capabilities
- MongoDB for flexible data storage
- The open-source community

## 📞 Support

If you encounter any issues:
1. Check the [Issues](https://github.com/DylanP97/node-wolvesville/issues) page
2. Create a new issue with detailed information
3. Provide server logs if applicable

---

Made with ❤️ by DylanP97
