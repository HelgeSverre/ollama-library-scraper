import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// Types
interface ModelListItem {
  name: string;
  description: string;
  parameters: string[];
  pulls: string;
  tags: number;
  lastUpdated: string;
  url: string;
  capabilities?: string[]; // tools, vision, thinking, embedding
}

interface ModelTag {
  name: string;
  size: string;
  digest: string;
  modifiedAt: string;
  contextWindow?: string;
  inputType?: string;
  aliases?: string[];
}

interface ModelDetails {
  name: string;
  description: string;
  downloads: string;
  lastUpdated: string;
  readmeHtml?: string;
  readmeMarkdown?: string;
  models: {
    name: string;
    size: string;
    contextWindow?: string;
    inputType?: string;
    lastUpdated: string;
  }[];
}

// Sorting options for model listing
type SortOption = 'newest' | 'most-popular' | 'oldest' | 'alphabetical';

/**
 * A scraper for extracting model information from the Ollama library website
 */
class OllamaScraper {
  private baseUrl = 'https://ollama.com';
  private turndownService: TurndownService;

  constructor() {
    // Initialize Turndown with GFM support
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });

    // Add GFM plugin for tables, strikethrough, etc.
    this.turndownService.use(gfm);

    // Configure to handle images properly
    this.turndownService.addRule('images', {
      filter: 'img',
      replacement: (content, node) => {
        const img = node as any;
        const alt = img.alt || '';
        const src = img.src || '';
        const title = img.title || '';

        // Handle relative URLs
        const fullSrc = src.startsWith('/') ? `https://ollama.com${src}` : src;

        return title ? `![${alt}](${fullSrc} "${title}")` : `![${alt}](${fullSrc})`;
      },
    });
  }

  /**
   * Scrape the model listing from the library page
   * @param options - Search query and sort options
   * @param options.query - Search query string
   * @param options.sort - Sort order (newest, most-popular, oldest, alphabetical)
   * @returns Array of model items with basic information
   */
  async getModelListing(options?: { query?: string; sort?: SortOption }): Promise<ModelListItem[]> {
    // Build URL with query parameters
    const url = new URL(`${this.baseUrl}/library`);
    if (options?.query) {
      url.searchParams.set('q', options.query);
    }
    if (options?.sort) {
      url.searchParams.set('sort', options.sort);
    }

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const models: ModelListItem[] = [];
      const seenModels = new Set<string>();

      // Find all list items containing models
      $('li').each((_, element) => {
        const $li = $(element);
        const $link = $li.find('a[href^="/library/"]').first();

        if (!$link.length) return;

        const href = $link.attr('href');
        if (!href || href.includes('/tags') || href.includes(':')) return;

        const modelName = href.replace('/library/', '');

        // Skip duplicates
        if (seenModels.has(modelName)) return;
        seenModels.add(modelName);

        // Try to find description in a more structured way
        let description = '';
        
        // Look for a description element (often in a p or div after the link)
        const $descElement = $li.find('p').first();
        if ($descElement.length) {
          description = $descElement.text().trim();
        } else {
          // Fallback: extract from full text
          const fullText = $li.text();
          const descriptionMatch = fullText.match(new RegExp(`${modelName}\\s+(.+?)(?:\\n|$)`, 's'));
          description = descriptionMatch ? descriptionMatch[1].trim() : '';
        }

        const fullText = $li.text();

        // Extract capabilities
        const capabilities: string[] = [];
        if (/\btools\b/i.test(fullText)) capabilities.push('tools');
        if (/\bvision\b/i.test(fullText)) capabilities.push('vision');
        if (/\bthinking\b/i.test(fullText)) capabilities.push('thinking');
        if (/\bembedding\b/i.test(fullText)) capabilities.push('embedding');

        // Extract parameters (sizes) - exclude matches followed by "Pulls" or "Tags"
        const parameters: string[] = [];
        const paramMatches = fullText.match(/\b\d+\.?\d*[bmk]\b/gi) || [];
        paramMatches.forEach(param => {
          const normalized = param.toLowerCase();
          // Check if this parameter is followed by "Pulls" or "Tags" in the text
          const paramRegex = new RegExp(
            `\\b${param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(Pulls|Tags)`,
            'i'
          );
          if (!paramRegex.test(fullText) && !parameters.includes(normalized)) {
            parameters.push(normalized);
          }
        });

        // Extract pulls/downloads
        const pullsMatch = fullText.match(/(\d+\.?\d*[KMB]?)\s*Pulls/i);
        const pulls = pullsMatch ? pullsMatch[1] : '0';

        // Extract tags count
        const tagsMatch = fullText.match(/(\d+)\s*Tags/i);
        const tags = tagsMatch ? parseInt(tagsMatch[1]) : 0;

        // Extract last updated
        const updatedMatch = fullText.match(/Updated\s+(.+?)(?:\n|$)/i);
        const lastUpdated = updatedMatch ? updatedMatch[1].trim() : '';

        models.push({
          name: modelName,
          description,
          parameters,
          pulls,
          tags,
          lastUpdated,
          url: `${this.baseUrl}${href}`,
          capabilities: capabilities.length > 0 ? capabilities : undefined,
        });
      });

      return models;
    } catch (error) {
      throw new Error(`Failed to fetch model listing: ${error}`);
    }
  }

  /**
   * Get details for a specific model
   * @param modelName - The name of the model (e.g., 'qwen3-coder')
   * @param tag - Optional specific tag (e.g., '30b-a3b-q4_K_M')
   * @returns Detailed model information including variants and readme
   */
  async getModelDetails(modelName: string, tag?: string): Promise<ModelDetails> {
    const url = tag
      ? `${this.baseUrl}/library/${modelName}:${tag}`
      : `${this.baseUrl}/library/${modelName}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract description using the proper selector
      const description = $('#summary-content').text().trim() || '';

      // Extract downloads - look for the download count element
      let downloads = '0';
      $('span, div').each((_, el) => {
        const text = $(el).text();
        const match = text.match(/^(\d+\.?\d*[KMB]?)\s*Downloads?$/i);
        if (match) {
          downloads = match[1];
          return false; // break the loop
        }
      });

      // Extract last updated - usually in a time element or after "Updated"
      let lastUpdated = '';
      $('time').each((_, el) => {
        const text = $(el).text().trim();
        if (text) {
          lastUpdated = text;
          return false;
        }
      });
      
      // Fallback: look for "Updated" text
      if (!lastUpdated) {
        const mainContent = $('main').text();
        const updatedMatch = mainContent.match(/Updated\s+(.+?)(?:\n|$)/i);
        lastUpdated = updatedMatch ? updatedMatch[1].trim() : '';
      }

      // Extract model variants
      const models: ModelDetails['models'] = [];
      const seenTags = new Set<string>();

      // Find all links that look like model tags
      $('a[href*="/library/"][href*=":"]').each((_, element) => {
        const $el = $(element);
        const href = $el.attr('href') || '';
        const tagMatch = href.match(/:([^/]+)$/);

        if (!tagMatch) return;

        const tagName = tagMatch[1];

        // Skip duplicates
        if (seenTags.has(tagName)) return;
        seenTags.add(tagName);

        // Get surrounding text for this tag
        const $parent = $el.closest('li, div, tr');
        const tagText = $parent.length ? $parent.text() : $el.parent().text();

        // Extract size
        const sizeMatch = tagText.match(/(\d+\.?\d*\s*[GMT]B)/i);
        const size = sizeMatch ? sizeMatch[1].replace(/\s+/g, '') : '';

        // Extract context window
        const contextMatch = tagText.match(/(\d+K)\s*context\s*window/i);
        const contextWindow = contextMatch ? contextMatch[1] : undefined;

        // Extract input type
        let inputType: string | undefined;
        if (/\bvision\b/i.test(tagText)) {
          inputType = 'Vision';
        } else if (/\btext\b/i.test(tagText)) {
          inputType = 'Text';
        }

        // Extract last updated for this variant
        const variantUpdatedMatch = tagText.match(/·\s*(.+?)$/);
        const variantUpdated = variantUpdatedMatch ? variantUpdatedMatch[1].trim() : '';

        models.push({
          name: tagName,
          size,
          contextWindow,
          inputType,
          lastUpdated: variantUpdated,
        });
      });

      // Extract readme if present
      let readmeHtml: string | undefined;
      let readmeMarkdown: string | undefined;

      // Look for the readme content in div#display
      const $displayDiv = $('#display');

      if ($displayDiv.length > 0) {
        // Get the raw HTML content
        readmeHtml = $displayDiv.html()?.trim() || undefined;

        if (readmeHtml) {
          // Convert to Markdown
          try {
            readmeMarkdown = this.turndownService.turndown(readmeHtml).trim();

            // Clean up any empty markdown
            if (readmeMarkdown.length === 0) {
              readmeMarkdown = undefined;
            }
          } catch (error) {
            console.warn('Failed to convert readme to markdown:', error);
            readmeMarkdown = undefined;
          }
        }
      }

      return {
        name: modelName,
        description,
        downloads,
        lastUpdated,
        readmeHtml,
        readmeMarkdown,
        models,
      };
    } catch (error) {
      throw new Error(`Failed to fetch model details: ${error}`);
    }
  }

  /**
   * Get all tags for a specific model
   * @param modelName - The name of the model
   * @returns Array of available tags with their metadata
   */
  async getModelTags(modelName: string): Promise<ModelTag[]> {
    const url = `${this.baseUrl}/library/${modelName}/tags`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const tags: ModelTag[] = [];
      const seenTags = new Set<string>();

      // Find all tag links - they appear in anchor tags with href containing model:tag
      $(`a[href*="/library/${modelName}:"]`).each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href') || '';
        const tagMatch = href.match(/:([^/]+)$/);

        if (!tagMatch) return;

        const tagName = tagMatch[1];

        // Skip duplicates
        if (seenTags.has(tagName)) return;
        seenTags.add(tagName);

        // Get the container that has the tag information for this specific tag
        // Strategy: look for the closest text that contains size info
        let text = '';
        
        // First, try the immediate next sibling (most common case)
        const $nextSibling = $link.next();
        if ($nextSibling.length) {
          const siblingText = $nextSibling.text();
          if (siblingText.includes('GB') || siblingText.includes('MB') || siblingText.includes('TB')) {
            text = siblingText;
          }
        }
        
        // If next sibling didn't work, try walking up parent containers but with limited scope
        if (!text) {
          let $container = $link.parent();
          let maxDepth = 3; // Reduced depth to avoid getting entire body
          
          while ($container.length && maxDepth > 0) {
            const containerText = $container.text();
            // Only use container if it's reasonably small (likely contains just this tag's info)
            if ((containerText.includes('GB') || containerText.includes('MB') || containerText.includes('TB')) 
                && containerText.length < 200) {
              text = containerText;
              break;
            }
            $container = $container.parent();
            maxDepth--;
          }
        }
        
        // If still no specific text found, try to find the immediate following text
        if (!text) {
          // Look for the very next element that might contain size info
          let $current = $link;
          for (let i = 0; i < 3; i++) { // Only check next few elements
            $current = $current.next();
            if (!$current.length) break;
            
            const elementText = $current.text();
            if (elementText.includes('GB') || elementText.includes('MB') || elementText.includes('TB')) {
              // Only use if it's a short text (likely just one tag's info)
              if (elementText.length < 100) {
                text = elementText;
                break;
              }
            }
          }
        }

        // Extract digest (12 character hex)
        const digestMatch = text.match(/\b([a-f0-9]{12})\b/);
        const digest = digestMatch ? digestMatch[1] : '';

        // Extract size
        const sizeMatch = text.match(/(\d+\.?\d*\s*[GMT]B)/i);
        const size = sizeMatch ? sizeMatch[1].replace(/\s+/g, '') : '';

        // Extract context window
        const contextMatch = text.match(/(\d+K)\s*context\s*window/i);
        const contextWindow = contextMatch ? contextMatch[1] : undefined;

        // Extract input type (looking for "Text input" or just "Text")
        let inputType: string | undefined;
        if (/\bvision\b/i.test(text)) {
          inputType = 'Vision';
        } else if (/\btext\b/i.test(text)) {
          inputType = 'Text';
        }

        // Extract modified date - usually after a bullet or at the end
        const datePatterns = [
          /(\d+\s*(?:hour|day|week|month|year)s?\s*ago)/i,
          /•\s*([^•]+?)\s*$/,
          /(\d{1,2}\s*\w+\s*ago)/i,
        ];

        let modifiedAt = '';
        for (const pattern of datePatterns) {
          const match = text.match(pattern);
          if (match) {
            modifiedAt = match[1].trim();
            break;
          }
        }

        // Check for aliases (like 'latest')
        const aliases: string[] = [];
        const tagText = $link.text().toLowerCase();
        if (tagName === 'latest' && text.includes('latest')) {
          // latest tag might be an alias
        } else if (tagName !== 'latest' && tagText.includes('latest')) {
          aliases.push('latest');
        }

        tags.push({
          name: tagName,
          size,
          digest,
          modifiedAt,
          contextWindow,
          inputType,
          aliases: aliases.length > 0 ? aliases : undefined,
        });
      });

      return tags;
    } catch (error) {
      throw new Error(`Failed to fetch model tags: ${error}`);
    }
  }
}

// Example usage
async function main() {
  const scraper = new OllamaScraper();

  try {
    // Get model listing
    console.log('=== Model Listing ===');
    const models = await scraper.getModelListing();
    console.log(`Found ${models.length} models`);
    console.log(models.slice(0, 3)); // Show first 3

    // Search for specific models
    console.log('\n=== Search Results for "qwen" ===');
    const searchResults = await scraper.getModelListing({
      query: 'qwen',
      sort: 'newest',
    });
    console.log(`Found ${searchResults.length} models matching "qwen"`);
    console.log(searchResults.slice(0, 2));

    // Get model details
    console.log('\n=== Model Details ===');
    const details = await scraper.getModelDetails('qwen3-coder');
    console.log(details);

    // Get model tags
    console.log('\n=== Model Tags ===');
    const tags = await scraper.getModelTags('qwen3-coder');
    console.log(`Found ${tags.length} tags`);
    console.log(tags.slice(0, 3));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Export the scraper class and types
export { OllamaScraper, ModelListItem, ModelTag, ModelDetails, SortOption };

// Run example if this file is executed directly
if (require.main === module) {
  main();
}
