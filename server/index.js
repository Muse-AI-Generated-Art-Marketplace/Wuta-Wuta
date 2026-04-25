const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const StellarListener = require('./stellarListener.js');
const broadcaster = require('./activityBroadcaster.js');
const ogRoutes = require('./routes/ogRoutes');
const websocketRoutes = require('./routes/websocketRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

let listener;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// AI Service (unchanged)
class AIService {
  constructor() {
    this.providers = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo'
      },
      huggingface: {
        apiKey: process.env.HUGGINGFACE_API_KEY,
        baseURL: 'https://api-inference.huggingface.co/models'
      }
    };
  }

  async callOpenAI(prompt) {
    if (!this.providers.openai.apiKey) throw new Error('OpenAI API key not configured');
    // ... (existing code)
  }

  async callHuggingFace(prompt) {
    if (!this.providers.huggingface.apiKey) throw new Error('HuggingFace API key not configured');
    // ... (existing code)
  }

  parseAIResponse(response, originalPrompt) {
    // ... (existing)
  }

  async generateContent(prompt, provider = 'openai') {
    // ... (existing)
  }
}

const aiService = new AIService();

// Existing AI route (unchanged)
app.post('/api/ai/generate', async (req, res) => {
  // ... (existing code)
});

// Health check — now includes WebSocket client count
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      openai:          !!process.env.OPENAI_API_KEY,
      huggingface:     !!process.env.HUGGINGFACE_API_KEY,
      stellarListener: listener ? listener.isRunning : false,
      websocket:       broadcaster.wss
        ? `${broadcaster.wss.clients.size} client(s) connected`
        : 'not attached',
    },
    env: {
      hasContractId: !!process.env.STELLAR_CONTRACT_ID
    }
  });
});

// OpenGraph Image Generation Routes
app.use('/api/og', ogRoutes);

// WebSocket Event Routes
app.use('/api/websocket', websocketRoutes);

// Stellar endpoints (unchanged)
app.get('/api/stellar/stats', async (req, res) => {
  const prisma = require('./prisma');
  const stats = await prisma.transaction.groupBy({
    by: ['eventType'],
    _count: { id: true }
  });
  res.json({ stats });
});

app.get('/api/stellar/recent', async (req, res) => {
  const prisma = require('./prisma');
  const recent = await prisma.transaction.findMany({
    take: 10,
    orderBy: { confirmedAt: 'desc' }
  });
  res.json(recent);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down...');
  if (listener) listener.stop();
  await broadcaster.close();
  process.exit(0);
});

// Start server — capture the http.Server so the WebSocket broadcaster
// can attach to the same port rather than opening a second one.
const httpServer = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Attach WebSocket broadcaster to the same HTTP server.
  // Clients connect via ws://localhost:3001/live-feed
  broadcaster.attach(httpServer);

  // Start Stellar listener — broadcaster is already imported by stellarListener.js
  listener = new StellarListener({
    horizonUrl: process.env.HORIZON_URL,
    contractId: process.env.STELLAR_CONTRACT_ID,
  });

  listener.start()
    .then(() => console.log('🌌 Stellar listener started successfully!'))
    .catch(err => console.error('❌ Failed to start Stellar listener:', err));
});

module.exports = app;
