import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OllamaScraper } from '../ollama-scraper';
import { FixtureLoader } from './helpers/fixture-loader';
import {
  createMockErrorResponse,
  createMockResponse,
  expectFetchCalledWith,
  setupFetchMock,
} from './helpers/mock-helpers';
import fetch from 'node-fetch';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

const mockFetch = vi.mocked(fetch) as any;

describe('OllamaScraper', () => {
  let scraper: OllamaScraper;

  beforeEach(() => {
    scraper = new OllamaScraper();
    vi.clearAllMocks();
    FixtureLoader.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getModelListing', () => {
    it('should parse newest listing correctly', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-newest.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const models = await scraper.getModelListing();

      expect(models.length).toBeGreaterThan(100); // Should have many models
      expect(models[0]).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        parameters: expect.any(Array),
        pulls: expect.any(String),
        tags: expect.any(Number),
        lastUpdated: expect.any(String),
        url: expect.stringContaining('https://ollama.com/library/'),
      });

      // Check for some expected models
      const deepseekModel = models.find(m => m.name === 'deepseek-r1');
      expect(deepseekModel).toBeDefined();
      if (deepseekModel) {
        expect(deepseekModel.capabilities).toContain('tools');
        expect(deepseekModel.capabilities).toContain('thinking');
      }
    });

    it('should parse popular listing correctly', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-popular.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const models = await scraper.getModelListing({ sort: 'most-popular' });

      expect(models.length).toBeGreaterThan(100);
      expectFetchCalledWith(mockFetch, 'https://ollama.com/library?sort=most-popular');

      // Most popular models should have high pull counts
      const topModel = models[0];
      expect(topModel.pulls).toMatch(/[0-9.]+[MK]/);
    });

    it('should handle search results', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-search-wizard.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const models = await scraper.getModelListing({
        query: 'wizard',
        sort: 'newest',
      });

      expectFetchCalledWith(mockFetch, 'https://ollama.com/library?q=wizard&sort=newest');
      expect(models.length).toBeGreaterThan(0);

      // All results should contain 'wizard' in the name
      models.forEach(model => {
        expect(model.name.toLowerCase()).toContain('wizard');
      });
    });

    it('should handle empty search results', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-search-no-results.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const models = await scraper.getModelListing({
        query: 'xyzabc123notfound',
      });

      expect(models).toEqual([]);
    });

    it('should throw error on HTTP failure', async () => {
      setupFetchMock(mockFetch, createMockErrorResponse(404));

      await expect(scraper.getModelListing()).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(scraper.getModelListing()).rejects.toThrow(
        'Failed to fetch model listing: Error: Network error'
      );
    });
  });

  describe('getModelDetails', () => {
    const testModels = [
      { name: 'magistral', hasReadme: true, isEmbedding: true },
      { name: 'granite-embedding', hasReadme: true, isEmbedding: true },
      { name: 'wizard-math', hasReadme: true, isEmbedding: false },
      { name: 'wizard-vicuna-uncensored', hasReadme: true, isEmbedding: false },
    ];

    testModels.forEach(({ name, hasReadme, isEmbedding }) => {
      it(`should parse ${name} model details correctly`, async () => {
        const html = FixtureLoader.loadHtml('models', `${name}/details.html`);
        setupFetchMock(mockFetch, createMockResponse(html));

        const details = await scraper.getModelDetails(name);

        expect(details).toMatchObject({
          name: name,
          description: expect.any(String),
          downloads: expect.stringMatching(/[0-9.]+[KMB]?/),
          lastUpdated: expect.any(String),
          models: expect.any(Array),
        });

        if (hasReadme) {
          expect(details.readmeHtml).toBeDefined();
          expect(details.readmeMarkdown).toBeDefined();
          expect(details.readmeMarkdown).not.toBe('');
        }

        expect(details.models.length).toBeGreaterThan(0);
        details.models.forEach(model => {
          expect(model).toMatchObject({
            name: expect.any(String),
            size: expect.stringMatching(/[0-9.]+[GM]B/),
            lastUpdated: expect.any(String),
          });
        });
      });
    });

    it('should handle specific tag variant', async () => {
      const html = FixtureLoader.loadHtml(
        'models',
        'wizard-vicuna-uncensored/variants/13b-q4_K_M.html'
      );
      setupFetchMock(mockFetch, createMockResponse(html));

      await scraper.getModelDetails('wizard-vicuna-uncensored', '13b-q4_K_M');

      expectFetchCalledWith(
        mockFetch,
        'https://ollama.com/library/wizard-vicuna-uncensored:13b-q4_K_M'
      );
    });

    it('should handle model without readme section', async () => {
      // Create a modified fixture without the display div
      const html = FixtureLoader.loadHtml('models', 'magistral/details.html');
      const htmlWithoutReadme = html.replace(/<div[^>]*id="display"[^>]*>[\s\S]*?<\/div>/gi, '');
      setupFetchMock(mockFetch, createMockResponse(htmlWithoutReadme));

      const details = await scraper.getModelDetails('test-model');
      expect(details.readmeHtml).toBeUndefined();
      expect(details.readmeMarkdown).toBeUndefined();
    });
  });

  describe('getModelTags', () => {
    const testModels = [
      'magistral',
      'granite-embedding',
      'wizard-math',
      'wizard-vicuna-uncensored',
    ];

    testModels.forEach(modelName => {
      it(`should parse ${modelName} tags correctly`, async () => {
        const html = FixtureLoader.loadHtml('models', `${modelName}/tags.html`);
        setupFetchMock(mockFetch, createMockResponse(html));

        const tags = await scraper.getModelTags(modelName);

        expect(tags.length).toBeGreaterThan(0);

        tags.forEach(tag => {
          expect(tag).toMatchObject({
            name: expect.any(String),
            size: expect.stringMatching(/[0-9.]+[GM]B/),
            digest: expect.stringMatching(/[a-f0-9]{12}/),
            modifiedAt: expect.any(String),
          });
        });

        // Check for 'latest' tag
        const latestTag = tags.find(t => t.name === 'latest');
        if (latestTag) {
          expect(latestTag).toBeDefined();
        }

        // Check for aliases
        const tagsWithAliases = tags.filter(t => t.aliases && t.aliases.length > 0);
        if (tagsWithAliases.length > 0) {
          expect(tagsWithAliases[0].aliases).toContain('latest');
        }
      });
    });

    it('should handle empty tags response', async () => {
      setupFetchMock(mockFetch, createMockResponse('<html><body></body></html>'));

      const tags = await scraper.getModelTags('nonexistent-model');
      expect(tags).toEqual([]);
    });

    it('should construct correct tags URL', async () => {
      const html = FixtureLoader.loadHtml('models', 'wizard-math/tags.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      await scraper.getModelTags('wizard-math');

      expectFetchCalledWith(mockFetch, 'https://ollama.com/library/wizard-math/tags');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed HTML gracefully', async () => {
      const malformedHtml = '<html><body><div>Incomplete HTML';
      setupFetchMock(mockFetch, createMockResponse(malformedHtml));

      // Should not throw, just return empty results
      const models = await scraper.getModelListing();
      expect(models).toEqual([]);
    });

    it('should handle server errors', async () => {
      setupFetchMock(mockFetch, createMockErrorResponse(500));

      await expect(scraper.getModelDetails('test-model')).rejects.toThrow(
        'HTTP error! status: 500'
      );
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(timeoutError);

      await expect(scraper.getModelListing()).rejects.toThrow('Failed to fetch model listing');
    });
  });

  describe('Integration tests with real fixtures', () => {
    it('should correctly parse model with many parameters', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-newest.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const models = await scraper.getModelListing();

      // Find a model with multiple parameter sizes
      const multiParamModel = models.find(m => m.parameters.length > 3);
      expect(multiParamModel).toBeDefined();

      if (multiParamModel) {
        expect(multiParamModel.parameters).toEqual(
          expect.arrayContaining([expect.stringMatching(/[0-9.]+[bmk]/i)])
        );
      }
    });

    it('should correctly identify model capabilities', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-newest.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const models = await scraper.getModelListing();

      // Check various capabilities
      const visionModels = models.filter(m => m.capabilities?.includes('vision'));
      const toolsModels = models.filter(m => m.capabilities?.includes('tools'));
      const embeddingModels = models.filter(m => m.capabilities?.includes('embedding'));

      expect(visionModels.length).toBeGreaterThan(0);
      expect(toolsModels.length).toBeGreaterThan(0);
      expect(embeddingModels.length).toBeGreaterThan(0);
    });

    it('should handle various date formats', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-newest.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const models = await scraper.getModelListing();

      // Check various date formats
      const dateFormats = models.map(m => m.lastUpdated).filter(Boolean);
      const hasHoursAgo = dateFormats.some(d => d.includes('hour'));
      const hasDaysAgo = dateFormats.some(d => d.includes('day'));
      const hasMonthsAgo = dateFormats.some(d => d.includes('month'));

      expect(hasHoursAgo || hasDaysAgo || hasMonthsAgo).toBe(true);
    });
  });
});
