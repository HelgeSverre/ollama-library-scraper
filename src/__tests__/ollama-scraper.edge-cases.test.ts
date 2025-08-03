import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaScraper } from '../ollama-scraper';
import { createMockResponse, setupFetchMock } from './helpers/mock-helpers';
import fetch from 'node-fetch';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

const mockFetch = vi.mocked(fetch) as any;

/**
 * Edge cases and boundary testing for the OllamaScraper
 * These tests cover unusual scenarios, malformed data, and edge conditions
 */
describe('OllamaScraper Edge Cases', () => {
  let scraper: OllamaScraper;

  beforeEach(() => {
    scraper = new OllamaScraper();
    vi.clearAllMocks();
  });

  describe('Malformed HTML handling', () => {
    it('should handle incomplete HTML gracefully', async () => {
      const malformedHtml = '<html><body><div>Incomplete';
      setupFetchMock(mockFetch, createMockResponse(malformedHtml));

      const models = await scraper.getModelListing();
      expect(models).toEqual([]);
    });

    it('should handle empty HTML body', async () => {
      const emptyHtml = '<html><head><title>Empty</title></head><body></body></html>';
      setupFetchMock(mockFetch, createMockResponse(emptyHtml));

      const models = await scraper.getModelListing();
      expect(models).toEqual([]);
    });

    it('should handle HTML with no model links', async () => {
      const noModelsHtml = `
        <html>
          <body>
            <div>Welcome to Ollama</div>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(noModelsHtml));

      const models = await scraper.getModelListing();
      expect(models).toEqual([]);
    });

    it('should handle HTML with special characters and encoding', async () => {
      const specialCharsHtml = `
        <html>
          <body>
            <li>
              <a href="/library/test-model">test-model</a>
              Description with émojis 🤖 and spëcial çharacters
              Parameters: 7b, 13b
              100K Pulls
              5 Tags
              Updated 2 hours ago
            </li>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(specialCharsHtml));

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(1);
      expect(models[0].description).toContain('émojis 🤖');
      expect(models[0].description).toContain('spëcial çharacters');
    });

    it('should handle nested HTML structures', async () => {
      const nestedHtml = `
        <html>
          <body>
            <div>
              <ul>
                <li>
                  <div>
                    <span>
                      <a href="/library/nested-model">nested-model</a>
                    </span>
                  </div>
                  <div>Nested description</div>
                  <div>Parameters: <span>7b</span>, <span>13b</span></div>
                  <div><strong>50K</strong> Pulls</div>
                  <div>3 Tags</div>
                  <div>Updated yesterday</div>
                </li>
              </ul>
            </div>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(nestedHtml));

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('nested-model');
      expect(models[0].parameters).toContain('7b');
      expect(models[0].pulls).toBe('50K');
    });
  });

  describe('Unusual data patterns', () => {
    it('should handle models with no parameters', async () => {
      const noParamsHtml = `
        <html>
          <body>
            <li>
              <a href="/library/no-params-model">no-params-model</a>
              Model with no parameter information
              Pulls
              1 Tags
              Updated recently
            </li>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(noParamsHtml));

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(1);
      expect(models[0].parameters).toEqual([]);
    });

    it('should handle models with unusual parameter formats', async () => {
      const unusualParamsHtml = `
        <html>
          <body>
            <li>
              <a href="/library/unusual-model">unusual-model</a>
              Model with unusual parameters
              Parameters: 0.5b, 100m, 1.5k, 2.7billion
              500 Pulls
              2 Tags
              Updated last week
            </li>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(unusualParamsHtml));

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(1);
      expect(models[0].parameters).toContain('0.5b');
      expect(models[0].parameters).toContain('100m');
      expect(models[0].parameters).toContain('1.5k');
      // Should not include non-matching patterns
      expect(models[0].parameters).not.toContain('2.7billion');
    });

    it('should handle models with zero pulls and tags', async () => {
      const zeroStatsHtml = `
        <html>
          <body>
            <li>
              <a href="/library/new-model">new-model</a>
              Brand new model
              Parameters: 7b
              0 Pulls
              0 Tags
              Updated now
            </li>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(zeroStatsHtml));

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(1);
      expect(models[0].pulls).toBe('0');
      expect(models[0].tags).toBe(0);
    });

    it('should handle models with very large numbers', async () => {
      const largeNumbersHtml = `
        <html>
          <body>
            <li>
              <a href="/library/popular-model">popular-model</a>
              Very popular model
              Parameters: 70b, 405b
              999.9M Pulls
              999 Tags
              Updated 1 second ago
            </li>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(largeNumbersHtml));

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(1);
      expect(models[0].pulls).toBe('999.9M');
      expect(models[0].tags).toBe(999);
      expect(models[0].parameters).toContain('70b');
      expect(models[0].parameters).toContain('405b');
    });
  });

  describe('Date and time edge cases', () => {
    it('should handle various date formats', async () => {
      const variousDateFormatsHtml = `
        <html>
          <body>
            <li>
              <a href="/library/model1">model1</a>
              Updated 1 hour ago
            </li>
            <li>
              <a href="/library/model2">model2</a>
              Updated 2 days ago
            </li>
            <li>
              <a href="/library/model3">model3</a>
              Updated 3 weeks ago
            </li>
            <li>
              <a href="/library/model4">model4</a>
              Updated 4 months ago
            </li>
            <li>
              <a href="/library/model5">model5</a>
              Updated a year ago
            </li>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(variousDateFormatsHtml));

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(5);
      expect(models[0].lastUpdated).toBe('1 hour ago');
      expect(models[1].lastUpdated).toBe('2 days ago');
      expect(models[2].lastUpdated).toBe('3 weeks ago');
      expect(models[3].lastUpdated).toBe('4 months ago');
      expect(models[4].lastUpdated).toBe('a year ago');
    });

    it('should handle missing or malformed dates', async () => {
      const malformedDatesHtml = `
        <html>
          <body>
            <li>
              <a href="/library/model1">model1</a>
              Description without date
              Parameters: 7b
            </li>
            <li>
              <a href="/library/model2">model2</a>
              Updated invalid-date
            </li>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(malformedDatesHtml));

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(2);
      expect(models[0].lastUpdated).toBe('');
      expect(models[1].lastUpdated).toBe('invalid-date');
    });
  });

  describe('Model details edge cases', () => {
    it('should handle model details with missing sections', async () => {
      const minimalDetailsHtml = `
        <html>
          <body>
            <main>
              minimal-model
              Basic description
            </main>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(minimalDetailsHtml));

      const details = await scraper.getModelDetails('minimal-model');
      expect(details.name).toBe('minimal-model');
      expect(details.downloads).toBe('0');
      expect(details.models).toEqual([]);
      expect(details.readmeHtml).toBeUndefined();
      expect(details.readmeMarkdown).toBeUndefined();
    });

    it('should handle readme with complex markdown content', async () => {
      const complexReadmeHtml = `
        <html>
          <body>
            <main>
              test-model
              Model description
              <div id="display">
                <h1>Complex README</h1>
                <p>This is a <strong>complex</strong> readme with:</p>
                <ul>
                  <li>Lists</li>
                  <li>Code: <code>print("hello")</code></li>
                </ul>
                <pre><code>def example():
    return "complex"</code></pre>
                <table>
                  <tr><th>Col 1</th><th>Col 2</th></tr>
                  <tr><td>Val 1</td><td>Val 2</td></tr>
                </table>
                <img src="/image.png" alt="Test image" title="Image title">
                <a href="https://example.com">External link</a>
              </div>
            </main>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(complexReadmeHtml));

      const details = await scraper.getModelDetails('test-model');
      expect(details.readmeMarkdown).toContain('# Complex README');
      expect(details.readmeMarkdown).toContain('**complex**');
      expect(details.readmeMarkdown).toContain('`print("hello")`');
      expect(details.readmeMarkdown).toContain('```\ndef example():');
      expect(details.readmeMarkdown).toContain('| Col 1 | Col 2 |');
      expect(details.readmeMarkdown).toContain(
        '![Test image](https://ollama.com/image.png "Image title")'
      );
      expect(details.readmeMarkdown).toContain('[External link](https://example.com)');
    });
  });

  describe('Tags edge cases', () => {
    it('should handle tags page with no tags', async () => {
      const noTagsHtml = `
        <html>
          <body>
            <main>
              <h1>Model Tags</h1>
              <p>No tags available</p>
            </main>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(noTagsHtml));

      const tags = await scraper.getModelTags('empty-model');
      expect(tags).toEqual([]);
    });

    it('should handle tags with missing or malformed digests', async () => {
      const malformedTagsHtml = `
        <html>
          <body>
            <a href="/library/test-model:latest">latest</a>
            <div>1.5GB · no-digest-here · 2 hours ago</div>
            <a href="/library/test-model:v1">v1</a>
            <div>2.0GB · invalid_digest · yesterday</div>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(malformedTagsHtml));

      const tags = await scraper.getModelTags('test-model');
      expect(tags).toHaveLength(2);
      expect(tags[0].digest).toBe(''); // No valid digest found
      expect(tags[1].digest).toBe(''); // Invalid digest format
    });

    it('should handle tags with unusual size formats', async () => {
      const unusualSizesHtml = `
        <html>
          <body>
            <a href="/library/test-model:tiny">tiny</a>
            <div>500MB · abc123def456 · 1 hour ago</div>
            <a href="/library/test-model:huge">huge</a>
            <div>1.5TB · def456abc789 · 2 days ago</div>
            <a href="/library/test-model:unknown">unknown</a>
            <div>? KB · 789abcdef012 · 1 week ago</div>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(unusualSizesHtml));

      const tags = await scraper.getModelTags('test-model');
      expect(tags).toHaveLength(3);

      // Find tags by name to avoid order issues
      const tinyTag = tags.find(t => t.name === 'tiny');
      const hugeTag = tags.find(t => t.name === 'huge');
      const unknownTag = tags.find(t => t.name === 'unknown');

      expect(tinyTag?.size).toBe('500MB');
      expect(hugeTag?.size).toBe('1.5TB'); // Should handle TB
      expect(unknownTag?.size).toBe(''); // Should not match '? KB'
    });
  });

  describe('Network and encoding edge cases', () => {
    it('should handle different content encodings', async () => {
      const html = '<html><body><li><a href="/library/test">test</a>Basic model</li></body></html>';

      // Mock response with different encoding
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: vi.fn().mockResolvedValue(html),
        headers: {
          get: (name: string) => {
            if (name.toLowerCase() === 'content-type') {
              return 'text/html; charset=iso-8859-1';
            }
            return null;
          },
        },
      });

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('test');
    });

    it('should handle responses with BOM (Byte Order Mark)', async () => {
      const htmlWithBOM =
        '\uFEFF<html><body><li><a href="/library/bom-test">bom-test</a>Model with BOM</li></body></html>';
      setupFetchMock(mockFetch, createMockResponse(htmlWithBOM));

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('bom-test');
    });
  });

  describe('Capability detection edge cases', () => {
    it('should handle mixed case capability keywords', async () => {
      const mixedCaseHtml = `
        <html>
          <body>
            <li>
              <a href="/library/mixed-caps">mixed-caps</a>
              Model with VISION, Tools, EMBEDDING, and thinking capabilities
              Parameters: 7b
            </li>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(mixedCaseHtml));

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(1);
      expect(models[0].capabilities).toContain('vision');
      expect(models[0].capabilities).toContain('tools');
      expect(models[0].capabilities).toContain('embedding');
      expect(models[0].capabilities).toContain('thinking');
    });

    it('should handle capability keywords in different contexts', async () => {
      const contextualHtml = `
        <html>
          <body>
            <li>
              <a href="/library/context-test">context-test</a>
              This model has computer vision but not revision tools. It supports text embedding.
              Parameters: 13b
            </li>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(contextualHtml));

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(1);
      expect(models[0].capabilities).toContain('vision');
      expect(models[0].capabilities).toContain('tools');
      expect(models[0].capabilities).toContain('embedding');
    });

    it('should not detect false positive capabilities', async () => {
      const falsePositiveHtml = `
        <html>
          <body>
            <li>
              <a href="/library/false-positive">false-positive</a>
              This model provides provisions for revisioning and emotional thinking patterns.
              Parameters: 7b
            </li>
          </body>
        </html>
      `;
      setupFetchMock(mockFetch, createMockResponse(falsePositiveHtml));

      const models = await scraper.getModelListing();
      expect(models).toHaveLength(1);
      // Should detect 'thinking' but not 'vision' or 'tools' from partial matches
      expect(models[0].capabilities).toContain('thinking');
      expect(models[0].capabilities).not.toContain('vision');
      expect(models[0].capabilities).not.toContain('tools');
    });
  });
});
