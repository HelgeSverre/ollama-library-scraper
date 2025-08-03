# Ollama.com Model Listing Library

## NOTES: Initial context and refernece links

we need to create a simple ts library that will scrape the available list of models and relevant deetails from the
ollama.com models library
on https://ollama.com/library there is no official api (yet) so we have to use web scraping, likely use fetch and
cheerio.

This has to run as a node script on the server due to CORS limitations if we try fetching data from the browser.

## List of models

```
https://ollama.com/library
```

## List of models

```
https://ollama.com/library?q=qwen&sort=newest
```

## Get model details

```
# latest
https://ollama.com/library/qwen3-coder

# specific tag

https://ollama.com/library/qwen3-coder:30b-a3b-q4_K_M

```

## Get model tags

```
https://ollama.com/library/qwen3-coder/tags
```

## Prior art to use as inspriation:

- https://github.com/i-am-mike-davis/ollama-admin-ui/blob/e4fb614fcc9412ab639bd2b951d408ca420f3539/app/wollama/wollama.py#L567

## Other relevant links:

- https://github.com/search?q=org%3Aollama+htmx&type=issues

---

## REFERENCE: Reference implementation

this direcotry contains a first draft aio generated version that has not ben verified to work yet.

### Summary from claude about the implementation:

1. Main Scraper (ollama-scraper.ts)

getModelListing(): Scrapes the model listing with support for search queries and sorting
getModelDetails(): Gets detailed information about a specific model (including readme)
getModelTags(): Retrieves all available tags/versions for a model
Fully typed with TypeScript interfaces
Proper error handling

2. Key Features

Extracts model metadata including:

Model names and descriptions
Parameter sizes (e.g., "7b", "30b", "8x7b")
Download counts
Number of tags
Last updated timestamps
Model capabilities (tools, vision, thinking, embedding)

Supports search with query parameters
Supports sorting (newest, most-popular, oldest, alphabetical)
Can fetch specific model versions/tags

3. Setup Files

package.json with all required dependencies
tsconfig.json for TypeScript configuration
Comprehensive README with usage examples

4. Usage Example
   typescriptconst scraper = new OllamaScraper();

// Get all models
const models = await scraper.getModelListing();

// Search for "qwen" models, sorted by newest
const results = await scraper.getModelListing({
query: 'qwen',
sort: 'newest'
});

// Get details for a specific model
const details = await scraper.getModelDetails('qwen3-coder');

// Get all tags for a model
const tags = await scraper.getModelTags('qwen3-coder');
The scraper uses Cheerio for HTML parsing (similar to jQuery) and handles the dynamic content structure of the Ollama
website. It's designed to be maintainable and extensible if the website structure changes.

---

# TASK INSTRUCTIONS

- install dependancies required.
- update all dependancies to the latest versions.
- verify the implementation and make sure it works as expected.
- improve the implementation if needed .
- write tests to verify the functionality of the scraper. (vitest)
- update the README with usage examples and installation instructions.
- prepare package.json for publishing to npm. (package name: ollama-library-scraper, author: helgesverre)
- Ensure the code is well-documented with Types/JSDoc comments for all public methods and classes.
