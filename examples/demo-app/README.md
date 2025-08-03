# Ollama Library Explorer - Demo App

A simple web application demonstrating the `ollama-library-scraper` package functionality.

## Features

- 🔍 **Search Models**: Search through the Ollama model library
- 📊 **Sort Options**: Sort by popularity, newest, oldest, or alphabetical
- 📋 **Model Details**: View detailed information about any model
- 🏷️ **Tags & Variants**: See all available tags and variants for each model
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Then open http://localhost:3000 in your browser.

## API Endpoints

The demo includes a REST API that showcases all package features:

- `GET /api/health` - Health check
- `GET /api/models` - List all models
- `GET /api/models?q=search&sort=newest` - Search and sort models
- `GET /api/models/:name` - Get detailed model information
- `GET /api/models/:name/tags` - Get all tags for a model

## Example Usage

### Search for code models

```
GET /api/models?q=code&sort=most-popular
```

### Get details for a specific model

```
GET /api/models/llama3.1
```

### Get all tags for a model

```
GET /api/models/qwen3-coder/tags
```

## Technology Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Package**: ollama-library-scraper
- **Styling**: Modern CSS with responsive design

## Package Integration

This demo shows how to integrate `ollama-library-scraper` in a real application:

```javascript
const { OllamaScraper } = require('ollama-library-scraper');
const scraper = new OllamaScraper();

// Search models
const models = await scraper.getModelListing({
  query: 'llama',
  sort: 'most-popular',
});

// Get model details
const details = await scraper.getModelDetails('llama3.1');

// Get model tags
const tags = await scraper.getModelTags('llama3.1');
```

This demonstrates the complete functionality of the package in a practical web application context.
