const express = require('express');
const cors = require('cors');
const path = require('path');
const { OllamaScraper } = require('ollama-library-scraper');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize the scraper
const scraper = new OllamaScraper();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Get all models or search models
app.get('/api/models', async (req, res) => {
  try {
    const { q: query, sort = 'most-popular' } = req.query;
    
    console.log(`Fetching models - Query: "${query || 'all'}", Sort: ${sort}`);
    
    const options = {
      sort: sort
    };
    
    if (query) {
      options.query = query;
    }
    
    const models = await scraper.getModelListing(options);
    
    console.log(`Found ${models.length} models`);
    
    res.json({
      success: true,
      count: models.length,
      models: models
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get model details
app.get('/api/models/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { tag } = req.query;
    
    console.log(`Fetching details for model: ${name}${tag ? ` (tag: ${tag})` : ''}`);
    
    const details = await scraper.getModelDetails(name, tag);
    
    res.json({
      success: true,
      details: details
    });
  } catch (error) {
    console.error(`Error fetching details for ${req.params.name}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get model tags
app.get('/api/models/:name/tags', async (req, res) => {
  try {
    const { name } = req.params;
    
    console.log(`Fetching tags for model: ${name}`);
    
    const tags = await scraper.getModelTags(name);
    
    res.json({
      success: true,
      count: tags.length,
      tags: tags
    });
  } catch (error) {
    console.error(`Error fetching tags for ${req.params.name}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Ollama Demo API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Ollama Demo Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available:`);
  console.log(`   GET /api/health - Health check`);
  console.log(`   GET /api/models - List all models`);
  console.log(`   GET /api/models?q=search&sort=newest - Search models`);
  console.log(`   GET /api/models/:name - Get model details`);
  console.log(`   GET /api/models/:name/tags - Get model tags`);
});