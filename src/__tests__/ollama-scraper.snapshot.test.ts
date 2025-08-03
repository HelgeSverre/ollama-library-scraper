import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OllamaScraper } from '../ollama-scraper';
import { FixtureLoader } from './helpers/fixture-loader';
import { createMockResponse, setupFetchMock } from './helpers/mock-helpers';
import fetch from 'node-fetch';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

const mockFetch = vi.mocked(fetch) as any;

/**
 * Snapshot testing for ensuring consistent parsing output
 * These tests verify that the scraper produces consistent results
 * and helps catch unintended changes in parsing logic.
 */
describe('OllamaScraper Snapshot Tests', () => {
  let scraper: OllamaScraper;
  const snapshotsDir = join(__dirname, 'fixtures/expected');

  beforeEach(() => {
    scraper = new OllamaScraper();
    vi.clearAllMocks();

    // Ensure snapshots directory exists
    if (!existsSync(snapshotsDir)) {
      mkdirSync(snapshotsDir, { recursive: true });
    }
  });

  /**
   * Helper function to save/compare snapshots
   */
  const expectToMatchSnapshot = (data: any, snapshotName: string) => {
    const snapshotPath = join(snapshotsDir, `${snapshotName}.json`);
    const serializedData = JSON.stringify(data, null, 2);

    if (!existsSync(snapshotPath)) {
      // Create new snapshot
      writeFileSync(snapshotPath, serializedData);
      console.warn(`Created new snapshot: ${snapshotName}.json`);
    } else {
      // Compare with existing snapshot
      const existingSnapshot = readFileSync(snapshotPath, 'utf-8');
      const existingData = JSON.parse(existingSnapshot);

      // Deep comparison
      expect(data).toEqual(existingData);
    }
  };

  describe('Model listing snapshots', () => {
    it('should match snapshot for newest listing', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-newest.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const models = await scraper.getModelListing();

      // Normalize dynamic data for consistent snapshots
      const normalizedModels = models.map(model => ({
        ...model,
        // Remove dynamic timestamps for consistent testing
        lastUpdated: model.lastUpdated ? 'TIMESTAMP_PLACEHOLDER' : '',
        url: model.url.replace('https://ollama.com', 'BASE_URL'),
      }));

      expectToMatchSnapshot(normalizedModels, 'listing-newest');
    });

    it('should match snapshot for popular listing', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-popular.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const models = await scraper.getModelListing({ sort: 'most-popular' });

      const normalizedModels = models.map(model => ({
        ...model,
        lastUpdated: model.lastUpdated ? 'TIMESTAMP_PLACEHOLDER' : '',
        url: model.url.replace('https://ollama.com', 'BASE_URL'),
      }));

      expectToMatchSnapshot(normalizedModels, 'listing-popular');
    });

    it('should match snapshot for search results', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-search-wizard.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const models = await scraper.getModelListing({ query: 'wizard' });

      const normalizedModels = models.map(model => ({
        ...model,
        lastUpdated: model.lastUpdated ? 'TIMESTAMP_PLACEHOLDER' : '',
        url: model.url.replace('https://ollama.com', 'BASE_URL'),
      }));

      expectToMatchSnapshot(normalizedModels, 'search-wizard');
    });
  });

  describe('Model details snapshots', () => {
    const testModels = [
      'magistral',
      'granite-embedding',
      'wizard-math',
      'wizard-vicuna-uncensored',
    ];

    testModels.forEach(modelName => {
      it(`should match snapshot for ${modelName} details`, async () => {
        const html = FixtureLoader.loadHtml('models', `${modelName}/details.html`);
        setupFetchMock(mockFetch, createMockResponse(html));

        const details = await scraper.getModelDetails(modelName);

        // Normalize dynamic data
        const normalizedDetails = {
          ...details,
          lastUpdated: details.lastUpdated ? 'TIMESTAMP_PLACEHOLDER' : '',
          models: details.models.map(model => ({
            ...model,
            lastUpdated: model.lastUpdated ? 'TIMESTAMP_PLACEHOLDER' : '',
          })),
        };

        expectToMatchSnapshot(normalizedDetails, `${modelName}-details`);
      });
    });
  });

  describe('Model tags snapshots', () => {
    const testModels = [
      'magistral',
      'granite-embedding',
      'wizard-math',
      'wizard-vicuna-uncensored',
    ];

    testModels.forEach(modelName => {
      it(`should match snapshot for ${modelName} tags`, async () => {
        const html = FixtureLoader.loadHtml('models', `${modelName}/tags.html`);
        setupFetchMock(mockFetch, createMockResponse(html));

        const tags = await scraper.getModelTags(modelName);

        // Normalize dynamic data
        const normalizedTags = tags.map(tag => ({
          ...tag,
          modifiedAt: tag.modifiedAt ? 'TIMESTAMP_PLACEHOLDER' : '',
        }));

        expectToMatchSnapshot(normalizedTags, `${modelName}-tags`);
      });
    });
  });

  describe('Edge case snapshots', () => {
    it('should match snapshot for empty search results', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-search-no-results.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const models = await scraper.getModelListing({ query: 'nonexistent' });

      expectToMatchSnapshot(models, 'empty-search-results');
    });

    it('should match snapshot for model without readme', async () => {
      const html = FixtureLoader.loadHtml('models', 'magistral/details.html');
      const htmlWithoutReadme = html.replace(/<div[^>]*id="display"[^>]*>[\s\S]*?<\/div>/gi, '');
      setupFetchMock(mockFetch, createMockResponse(htmlWithoutReadme));

      const details = await scraper.getModelDetails('test-model');

      const normalizedDetails = {
        ...details,
        lastUpdated: details.lastUpdated ? 'TIMESTAMP_PLACEHOLDER' : '',
        models: details.models.map(model => ({
          ...model,
          lastUpdated: model.lastUpdated ? 'TIMESTAMP_PLACEHOLDER' : '',
        })),
      };

      expectToMatchSnapshot(normalizedDetails, 'model-without-readme');
    });
  });

  describe('Data consistency checks', () => {
    it('should have consistent model structure across all snapshots', async () => {
      const html = FixtureLoader.loadHtml('library', 'listing-newest.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const models = await scraper.getModelListing();

      // Verify consistent structure
      models.forEach(model => {
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('description');
        expect(model).toHaveProperty('parameters');
        expect(model).toHaveProperty('pulls');
        expect(model).toHaveProperty('tags');
        expect(model).toHaveProperty('lastUpdated');
        expect(model).toHaveProperty('url');

        // Type checks
        expect(typeof model.name).toBe('string');
        expect(typeof model.description).toBe('string');
        expect(Array.isArray(model.parameters)).toBe(true);
        expect(typeof model.pulls).toBe('string');
        expect(typeof model.tags).toBe('number');
        expect(typeof model.lastUpdated).toBe('string');
        expect(typeof model.url).toBe('string');

        if (model.capabilities) {
          expect(Array.isArray(model.capabilities)).toBe(true);
        }
      });
    });

    it('should have consistent tag structure', async () => {
      const html = FixtureLoader.loadHtml('models', 'magistral/tags.html');
      setupFetchMock(mockFetch, createMockResponse(html));

      const tags = await scraper.getModelTags('magistral');

      tags.forEach(tag => {
        expect(tag).toHaveProperty('name');
        expect(tag).toHaveProperty('size');
        expect(tag).toHaveProperty('digest');
        expect(tag).toHaveProperty('modifiedAt');

        expect(typeof tag.name).toBe('string');
        expect(typeof tag.size).toBe('string');
        expect(typeof tag.digest).toBe('string');
        expect(typeof tag.modifiedAt).toBe('string');

        if (tag.contextWindow) {
          expect(typeof tag.contextWindow).toBe('string');
        }
        if (tag.inputType) {
          expect(typeof tag.inputType).toBe('string');
        }
        if (tag.aliases) {
          expect(Array.isArray(tag.aliases)).toBe(true);
        }
      });
    });
  });
});
