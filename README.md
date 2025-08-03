# Ollama Library Scraper

[![npm version](https://badge.fury.io/js/ollama-library-scraper.svg)](https://badge.fury.io/js/ollama-library-scraper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A TypeScript/Node.js library for extracting model information from the Ollama library website. Get structured data about AI models, their variants, tags, and metadata with a simple, type-safe API.

## 🚀 Quick Start

```bash
npm install ollama-library-scraper
```

```typescript
import { OllamaScraper } from 'ollama-library-scraper';

const scraper = new OllamaScraper();

// Get all models
const models = await scraper.getModelListing();
console.log(`Found ${models.length} models`);

// Get specific model details
const details = await scraper.getModelDetails('llama3.1');
console.log(details);
```

## 📦 Installation

### npm

```bash
npm install ollama-library-scraper
```

### yarn

```bash
yarn add ollama-library-scraper
```

### pnpm

```bash
pnpm add ollama-library-scraper
```

## ✨ Features

- 🎯 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🚀 **Simple API**: Easy-to-use methods for common operations
- 📊 **Comprehensive Data**: Extract model details, tags, capabilities, and metadata
- 🔍 **Search & Filter**: Search models and filter by various criteria
- 🏷️ **Tag Support**: Get detailed information about model variants and tags
- ⚡ **Performance**: Optimized for speed with intelligent parsing
- 🧪 **Well-Tested**: Comprehensive test suite with 80+ tests and high coverage
- 📖 **Great DX**: Excellent developer experience with clear documentation

## 🔧 Usage

### Basic Usage

```typescript
// ES Modules
import { OllamaScraper } from 'ollama-library-scraper';

// CommonJS
const { OllamaScraper } = require('ollama-library-scraper');

const scraper = new OllamaScraper();

// Get all models
const models = await scraper.getModelListing();
console.log(`Found ${models.length} models`);

// Search for models
const qwenModels = await scraper.getModelListing({
  query: 'qwen',
  sort: 'newest',
});

// Get model details
const details = await scraper.getModelDetails('qwen3-coder');
console.log(details);

// Get model tags
const tags = await scraper.getModelTags('qwen3-coder');
console.log(`Model has ${tags.length} tags`);
```

### Advanced Examples

```typescript
// Search with different sort options
const popularModels = await scraper.getModelListing({
  sort: 'most-popular',
});

const newestCodeModels = await scraper.getModelListing({
  query: 'code',
  sort: 'newest',
});

// Get details for a specific tag
const tagDetails = await scraper.getModelDetails('qwen3-coder', '30b-a3b-q4_K_M');

// Filter models by capabilities
const visionModels = (await scraper.getModelListing()).filter(model =>
  model.capabilities?.includes('vision')
);

const toolsModels = (await scraper.getModelListing()).filter(model =>
  model.capabilities?.includes('tools')
);
```

### 🌟 Real-World Examples

#### Find the most popular code models

```typescript
const popularCodeModels = await scraper.getModelListing({
  query: 'code',
  sort: 'most-popular',
});

console.log('Top code models:', popularCodeModels.slice(0, 5));
```

#### Get all vision-capable models

```typescript
const allModels = await scraper.getModelListing();
const visionModels = allModels.filter(model => model.capabilities?.includes('vision'));

console.log(`Found ${visionModels.length} vision models`);
```

#### Compare model sizes across variants

```typescript
const modelName = 'llama3.1';
const tags = await scraper.getModelTags(modelName);

tags.forEach(tag => {
  console.log(`${tag.name}: ${tag.size}`);
});
```

#### Build a model recommendation system

```typescript
async function recommendModels(userQuery: string) {
  const models = await scraper.getModelListing({
    query: userQuery,
    sort: 'most-popular',
  });

  return models.slice(0, 10).map(model => ({
    name: model.name,
    description: model.description,
    popularity: model.pulls,
    capabilities: model.capabilities || [],
  }));
}

const recommendations = await recommendModels('chat');
```

## 📚 API Reference

### OllamaScraper Class

#### `getModelListing(options?)`

Fetches the list of models from the Ollama library.

**Parameters:**

- `options` (optional):
  - `query?: string` - Search query to filter models
  - `sort?: SortOption` - Sort order ('newest' | 'most-popular' | 'oldest' | 'alphabetical')

**Returns:** `Promise<ModelListItem[]>`

#### `getModelDetails(modelName, tag?)`

Gets detailed information about a specific model.

**Parameters:**

- `modelName: string` - The name of the model (e.g., 'qwen3-coder')
- `tag?: string` - Optional specific tag/version (e.g., '30b-a3b-q4_K_M')

**Returns:** `Promise<ModelDetails>`

#### `getModelTags(modelName)`

Retrieves all available tags for a specific model.

**Parameters:**

- `modelName: string` - The name of the model

**Returns:** `Promise<ModelTag[]>`

## Data Types

### ModelListItem

```typescript
interface ModelListItem {
  name: string; // e.g., "qwen3-coder"
  description: string; // Model description
  parameters: string[]; // e.g., ["30b", "480b"]
  pulls: string; // e.g., "17.9K"
  tags: number; // Number of available tags
  lastUpdated: string; // e.g., "2 days ago"
  url: string; // Full URL to model page
  capabilities?: string[]; // e.g., ["tools", "vision", "thinking", "embedding"]
}
```

### ModelDetails

```typescript
interface ModelDetails {
  name: string;
  description: string;
  downloads: string; // e.g., "18K"
  lastUpdated: string;
  readmeHtml?: string; // Raw HTML content from readme section
  readmeMarkdown?: string; // Converted Markdown content
  models: {
    name: string; // Tag name
    size: string; // e.g., "19GB"
    contextWindow?: string; // e.g., "256K"
    inputType?: string; // e.g., "Text", "Vision"
    lastUpdated: string;
  }[];
}
```

### ModelTag

```typescript
interface ModelTag {
  name: string; // Tag name
  size: string; // Model size (e.g., "19GB")
  digest: string; // Model digest hash (12 chars)
  modifiedAt: string; // Last modified date
  contextWindow?: string; // e.g., "256K"
  inputType?: string; // e.g., "Text", "Vision"
  aliases?: string[]; // e.g., ["latest"]
}
```

### SortOption

```typescript
type SortOption = 'newest' | 'most-popular' | 'oldest' | 'alphabetical';
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/helgesverre/ollama-library-scraper.git
cd ollama-library-scraper

# Install dependencies
npm install

# Run development mode
npm run dev
```

### Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Run the example script in development mode
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Testing

The project uses Vitest for testing. Tests mock the HTTP requests to avoid hitting the actual website during testing.

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Error Handling

All methods throw errors with descriptive messages:

```typescript
try {
  const models = await scraper.getModelListing();
} catch (error) {
  console.error('Failed to fetch models:', error.message);
}
```

## Notes

- The scraper uses Cheerio for HTML parsing, which is fast and jQuery-like
- All methods are async and return Promises
- The scraper handles malformed HTML gracefully
- Rate limiting is not implemented - be respectful of the server
- The scraper extracts data from the HTML structure of ollama.com, which may change over time

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

helgesverre

## Links

- [Repository](https://github.com/helgesverre/ollama-library-scraper)
- [Issues](https://github.com/helgesverre/ollama-library-scraper/issues)
- [npm Package](https://www.npmjs.com/package/ollama-library-scraper)
