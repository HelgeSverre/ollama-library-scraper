# Ollama Library Scraper

[![npm version](https://badge.fury.io/js/ollama-library-scraper.svg)](https://badge.fury.io/js/ollama-library-scraper)
[![CI](https://github.com/helgesverre/ollama-library-scraper/workflows/CI/badge.svg)](https://github.com/helgesverre/ollama-library-scraper/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Programmatically access Ollama's model library with a type-safe TypeScript API. Search models, extract metadata, compare variants, and retrieve download statistics—no HTML parsing required.

## Installation

```bash
npm install ollama-library-scraper
yarn add ollama-library-scraper
pnpm add ollama-library-scraper
bun add ollama-library-scraper
```

## Quick Start

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

## Usage

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

### Real-World Examples

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

## API Reference

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
- `npm run format` - Format all code files with Prettier
- `npm run format:check` - Check code formatting
- `npm run lint` - Run linting and formatting checks

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

## Why Use This Library?

- **Avoid Manual HTML Parsing** - Pre-built selectors and parsing logic
- **Type Safety** - Full TypeScript definitions prevent runtime errors
- **Maintained** - Regularly updated to match ollama.com structure changes
- **Well Tested** - Comprehensive test suite ensures reliability
- **Simple API** - Three main methods cover all use cases
- **Framework Agnostic** - Works with any Node.js framework or runtime
- **No Official API** - Ollama doesn't provide an API for their model library; this is the only programmatic way to access it

## Important Notes

- ⚠️ **No Rate Limiting**: Implement your own delays to be respectful of ollama.com servers
- 🔄 **HTML Changes**: The scraper depends on ollama.com's HTML structure, which may change
- 📦 **No Caching**: Each call makes a fresh HTTP request - implement caching if needed
- 🌐 **Network Required**: All methods require internet connectivity
- 🛡️ **Error Handling**: Always wrap calls in try-catch blocks for production use

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
