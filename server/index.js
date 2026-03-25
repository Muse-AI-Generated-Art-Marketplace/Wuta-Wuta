const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const { processImage } = require('./utils/imageProcessor');
require('dotenv').config();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'http://localhost:3000',
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// AI Service Handler
class AIService {
  constructor() {
    this.providers = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo',
      },
      huggingface: {
        apiKey: process.env.HUGGINGFACE_API_KEY,
        baseURL: 'https://api-inference.huggingface.co/models',
      },
    };
  }

  async callOpenAI(prompt) {
    if (!this.providers.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.providers.openai.baseURL}/chat/completions`,
        {
          model: this.providers.openai.model,
          messages: [
            {
              role: 'system',
              content:
                'You are an AI art generator assistant. Generate creative and descriptive responses for art prompts. Keep responses concise but vivid.',
            },
            {
              role: 'user',
              content: `Generate an art description and title for this prompt: "${prompt}"`,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.providers.openai.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      return this.parseAIResponse(aiResponse, prompt);
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error('OpenAI service unavailable');
    }
  }

  async callHuggingFace(prompt) {
    if (!this.providers.huggingface.apiKey) {
      throw new Error('HuggingFace API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.providers.huggingface.baseURL}/bigscience/bloom`,
        {
          inputs: `Generate an art description for: ${prompt}`,
          parameters: {
            max_new_tokens: 200,
            temperature: 0.7,
            do_sample: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.providers.huggingface.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data[0].generated_text;
      return this.parseAIResponse(aiResponse, prompt);
    } catch (error) {
      console.error(
        'HuggingFace API error:',
        error.response?.data || error.message
      );
      throw new Error('HuggingFace service unavailable');
    }
  }

  parseAIResponse(response, originalPrompt) {
    // Extract title and description from AI response
    const lines = response.split('\n').filter((line) => line.trim());
    let title = originalPrompt.slice(0, 60);
    let description = response;

    // Try to extract a title (first line or sentence)
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 100) {
        title = firstLine.replace(/^["'"]|["'"]$/g, '');
        description = lines.slice(1).join('\n').trim() || response;
      }
    }

    return {
      title: title || 'AI Generated Art',
      description: description || response,
      prompt: originalPrompt,
      image_base64:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=', // Placeholder
      attributes: [],
      provider: 'ai',
    };
  }

  async generateContent(prompt, provider = 'openai') {
    try {
      switch (provider.toLowerCase()) {
        case 'openai':
          return await this.callOpenAI(prompt);
        case 'huggingface':
          return await this.callHuggingFace(prompt);
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      console.error(`AI service error (${provider}):`, error.message);
      throw error;
    }
  }
}

const aiService = new AIService();

// Routes
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt, provider = 'openai' } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Valid prompt is required',
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        error: 'Prompt too long (max 1000 characters)',
      });
    }

    console.log(
      `Generating content for prompt: "${prompt.substring(0, 50)}..."`
    );

    const result = await aiService.generateContent(prompt, provider);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI generation error:', error);

    // Return mock response on failure
    const mockResponse = {
      title: req.body.prompt
        ? req.body.prompt.slice(0, 60)
        : 'AI Generated Art',
      description: `Generated from prompt: ${req.body.prompt || 'AI art'}\nThis is a fallback description due to service unavailability.`,
      image_base64:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=',
      prompt: req.body.prompt || '',
      attributes: [],
      provider: 'mock',
    };

    res.status(500).json({
      success: false,
      error: error.message,
      data: mockResponse, // Provide fallback
    });
  }
});

// Artwork upload and optimization pipeline
app.post('/api/upload/artwork', upload.single('artwork'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No artwork file provided' });
    }

    const { artworkId, name, description, artistAddress, aiModel } = req.body;
    
    console.log(`🖼️  Processing artwork: ${name} (${artworkId})`);
    
    // 1. Optimize and create thumbnail
    const { optimized, thumbnail, metadata } = await processImage(req.file.buffer);
    
    // 2. Prepare Pinata pinning logic
    const JWT = process.env.REACT_APP_PINATA_JWT;
    if (!JWT) throw new Error('Pinata JWT not configured on server');

    const pinFileToIPFS = async (buffer, filename, type) => {
      const form = new FormData();
      form.append('file', buffer, { filename });
      form.append('pinataMetadata', JSON.stringify({
        name: `muse-${type}-${artworkId}`,
        keyvalues: { project: 'Wuta-Wuta', type, artworkId }
      }));
      form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
        maxBodyLength: Infinity,
        headers: {
          'Authorization': `Bearer ${JWT}`,
          ...form.getHeaders()
        }
      });
      return response.data.IpfsHash;
    };

    // 3. Pin optimized image and thumbnail in parallel
    console.log('🚀 Pinning processed images to IPFS...');
    const [imageCID, thumbnailCID] = await Promise.all([
      pinFileToIPFS(optimized, `artwork-${artworkId}.webp`, 'optimized'),
      pinFileToIPFS(thumbnail, `thumb-${artworkId}.webp`, 'thumbnail')
    ]);

    // 4. Pin Metadata JSON
    console.log('📄 Pinning metadata to IPFS...');
    const nftMetadata = {
      name,
      description,
      image: `ipfs://${imageCID}`,
      thumbnail: `ipfs://${thumbnailCID}`,
      external_url: `${process.env.REACT_APP_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs'}/${imageCID}`,
      artist: artistAddress,
      ai_model: aiModel,
      collaborators: [],
      created_at: new Date().toISOString(),
      attributes: [
        { trait_type: 'AI Model', value: aiModel },
        { trait_type: 'Artist', value: artistAddress },
        { trait_type: 'Collaboration Type', value: 'AI-Human' },
        { trait_type: 'Original Width', value: metadata.width },
        { trait_type: 'Original Height', value: metadata.height }
      ]
    };

    const metadataResponse = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      pinataContent: nftMetadata,
      pinataMetadata: {
        name: `muse-metadata-${artworkId}`,
        keyvalues: { project: 'Wuta-Wuta', type: 'metadata', artworkId }
      },
      pinataOptions: { cidVersion: 1 }
    }, {
      headers: { 
        'Authorization': `Bearer ${JWT}`,
        'Content-Type': 'application/json'
      }
    });

    const metadataCID = metadataResponse.data.IpfsHash;

    res.json({
      success: true,
      imageCID,
      thumbnailCID,
      metadataCID,
      tokenURI: `ipfs://${metadataCID}`
    });

  } catch (error) {
    console.error('Upload pipeline error:', error);
    res.status(500).json({ 
      error: 'Failed to process and upload artwork',
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      huggingface: !!process.env.HUGGINGFACE_API_KEY,
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Proxy Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI endpoint: http://localhost:${PORT}/api/ai/generate`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
