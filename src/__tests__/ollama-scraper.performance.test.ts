import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaScraper } from '../ollama-scraper';
import { createMockResponse, setupFetchMock, delay } from './helpers/mock-helpers';
import { FixtureLoader } from './helpers/fixture-loader';
import fetch from 'node-fetch';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

const mockFetch = vi.mocked(fetch) as any;

describe('OllamaScraper Performance Tests', () => {
  let scraper: OllamaScraper;

  beforeEach(() => {
    scraper = new OllamaScraper();
    vi.clearAllMocks();
  });

  describe('Timeout handling', () => {
    it('should handle slow responses gracefully', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-newest.html');

      // Mock a slow response
      mockFetch.mockImplementation(async () => {
        await delay(100); // Simulate slow network
        return createMockResponse(html);
      });

      const startTime = Date.now();
      const models = await scraper.getModelListing();
      const endTime = Date.now();

      expect(models.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should handle request timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValue(timeoutError);

      await expect(scraper.getModelListing()).rejects.toThrow('Failed to fetch model listing');
    });
  });

  describe('Large response handling', () => {
    it('should handle large model listings efficiently', async () => {
      // Create a large HTML response
      const baseHtml = FixtureLoader.loadHtml('library', 'listing-newest.html');
      const largeHtml = baseHtml.repeat(10); // Simulate very large response

      setupFetchMock(mockFetch, createMockResponse(largeHtml));

      const startTime = Date.now();
      const models = await scraper.getModelListing();
      const endTime = Date.now();

      expect(models.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle empty responses efficiently', async () => {
      setupFetchMock(mockFetch, createMockResponse('<html><body></body></html>'));

      const startTime = Date.now();
      const models = await scraper.getModelListing();
      const endTime = Date.now();

      expect(models).toEqual([]);
      expect(endTime - startTime).toBeLessThan(1000); // Should be very fast
    });
  });

  describe('Memory usage', () => {
    it('should not leak memory with repeated calls', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-newest.html');

      // Mock multiple responses (clear any existing mocks first)
      mockFetch.mockClear();
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce(createMockResponse(html));
      }

      // Measure memory before
      const initialMemory = process.memoryUsage().heapUsed;

      // Make multiple requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(scraper.getModelListing());
      }
      await Promise.all(promises);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 150MB to account for test environment overhead)
      expect(memoryIncrease).toBeLessThan(150 * 1024 * 1024);
    });
  });

  describe('Concurrent requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const listingHtml = FixtureLoader.loadHtml('library', 'listing-newest.html');
      const detailsHtml = FixtureLoader.loadHtml('models', 'magistral/details.html');
      const tagsHtml = FixtureLoader.loadHtml('models', 'magistral/tags.html');

      // Setup mocks for concurrent requests
      mockFetch
        .mockResolvedValueOnce(createMockResponse(listingHtml))
        .mockResolvedValueOnce(createMockResponse(detailsHtml))
        .mockResolvedValueOnce(createMockResponse(tagsHtml));

      const startTime = Date.now();

      const [models, details, tags] = await Promise.all([
        scraper.getModelListing(),
        scraper.getModelDetails('magistral'),
        scraper.getModelTags('magistral'),
      ]);

      const endTime = Date.now();

      expect(models.length).toBeGreaterThan(0);
      expect(details.name).toBe('magistral');
      expect(tags.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete quickly when concurrent
    });

    it('should handle partial failures in concurrent requests', async () => {
      const listingHtml = FixtureLoader.loadHtml('library', 'listing-newest.html');

      // Setup mock to handle both success and failure
      mockFetch.mockImplementation((url: any) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr.includes('/library') && !urlStr.includes('/library/')) {
          return Promise.resolve(createMockResponse(listingHtml));
        } else {
          return Promise.reject(new Error('Network error'));
        }
      });

      const results = await Promise.allSettled([
        scraper.getModelListing(),
        scraper.getModelDetails('nonexistent'),
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');

      if (results[0].status === 'fulfilled') {
        expect(results[0].value.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Rate limiting simulation', () => {
    it('should handle rate limiting responses', async () => {
      // Clear any existing mocks first
      mockFetch.mockClear();

      // Mock rate limiting response (429 Too Many Requests)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: vi.fn().mockResolvedValue('Rate limit exceeded'),
        headers: {
          get: (name: string) => {
            if (name.toLowerCase() === 'retry-after') {
              return '60'; // Retry after 60 seconds
            }
            return null;
          },
        },
      });

      await expect(scraper.getModelListing()).rejects.toThrow(
        'Failed to fetch model listing: Error: HTTP error! status: 429'
      );
    });

    it('should handle server errors gracefully', async () => {
      // Mock server error (503 Service Unavailable)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: vi.fn().mockResolvedValue('Service temporarily unavailable'),
        headers: {
          get: () => null,
        },
      });

      await expect(scraper.getModelDetails('test-model')).rejects.toThrow(
        'HTTP error! status: 503'
      );
    });
  });
});
