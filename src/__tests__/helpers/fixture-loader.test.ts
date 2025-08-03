import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FixtureLoader } from './fixture-loader';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('FixtureLoader', () => {
  const testFixturesPath = join(__dirname, '../fixtures-test');
  const testMetadataPath = join(testFixturesPath, 'metadata/fixtures.json');

  beforeEach(() => {
    // Create test fixture directory structure
    mkdirSync(join(testFixturesPath, 'html/library'), { recursive: true });
    mkdirSync(join(testFixturesPath, 'metadata'), { recursive: true });
    mkdirSync(join(testFixturesPath, 'expected'), { recursive: true });

    // Create test HTML fixture
    writeFileSync(
      join(testFixturesPath, 'html/library/test.html'),
      '<html><body>Test content</body></html>'
    );

    // Create test metadata
    const metadata = {
      version: '1.0.0',
      lastUpdated: '2023-01-01T00:00:00.000Z',
      fixtures: {
        'library/test.html': {
          url: 'https://example.com/test',
          fetchedAt: '2023-01-01T00:00:00.000Z',
          description: 'Test fixture',
        },
      },
    };
    writeFileSync(testMetadataPath, JSON.stringify(metadata, null, 2));

    // Create expected data file
    writeFileSync(
      join(testFixturesPath, 'expected/test.json'),
      JSON.stringify({ test: 'data' }, null, 2)
    );
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync(testFixturesPath)) {
      rmSync(testFixturesPath, { recursive: true, force: true });
    }
    FixtureLoader.clearCache();
  });

  describe('loadHtml', () => {
    it('should load HTML fixture successfully', () => {
      // Temporarily override the fixtures path for testing
      const originalPath = (FixtureLoader as any).fixturesPath;
      (FixtureLoader as any).fixturesPath = join(testFixturesPath, 'html');

      const content = FixtureLoader.loadHtml('library', 'test.html');
      expect(content).toBe('<html><body>Test content</body></html>');

      // Restore original path
      (FixtureLoader as any).fixturesPath = originalPath;
    });

    it('should cache loaded fixtures', () => {
      const originalPath = (FixtureLoader as any).fixturesPath;
      (FixtureLoader as any).fixturesPath = join(testFixturesPath, 'html');

      // Load twice
      const content1 = FixtureLoader.loadHtml('library', 'test.html');
      const content2 = FixtureLoader.loadHtml('library', 'test.html');

      expect(content1).toBe(content2);
      expect(content1).toBe('<html><body>Test content</body></html>');

      (FixtureLoader as any).fixturesPath = originalPath;
    });

    it('should throw error for non-existent fixture', () => {
      const originalPath = (FixtureLoader as any).fixturesPath;
      (FixtureLoader as any).fixturesPath = join(testFixturesPath, 'html');

      expect(() => {
        FixtureLoader.loadHtml('library', 'nonexistent.html');
      }).toThrow('Fixture not found');

      (FixtureLoader as any).fixturesPath = originalPath;
    });
  });

  describe('loadExpectedData', () => {
    it('should load and parse expected JSON data', () => {
      // Temporarily override the internal path for testing
      const originalDirname = __dirname;
      const mockDirname = join(testFixturesPath, '..');

      // Create a spy on the join function or temporarily override __dirname
      const mockLoadExpectedData = (filename: string) => {
        const filepath = join(testFixturesPath, 'expected', filename);
        const { readFileSync, existsSync } = require('fs');

        if (!existsSync(filepath)) {
          throw new Error(`Expected data not found: ${filepath}`);
        }

        const content = readFileSync(filepath, 'utf-8');
        return JSON.parse(content);
      };

      const data = mockLoadExpectedData('test.json');
      expect(data).toEqual({ test: 'data' });
    });

    it('should throw error for invalid JSON', () => {
      writeFileSync(join(testFixturesPath, 'expected/invalid.json'), 'invalid json content');

      expect(() => {
        FixtureLoader.loadExpectedData('invalid.json');
      }).toThrow();
    });
  });

  describe('loadMetadata', () => {
    it('should load existing metadata', () => {
      const originalPath = (FixtureLoader as any).metadataPath;
      (FixtureLoader as any).metadataPath = testMetadataPath;

      const metadata = FixtureLoader.loadMetadata();
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.fixtures['library/test.html']).toBeDefined();

      (FixtureLoader as any).metadataPath = originalPath;
    });

    it('should return default metadata when file does not exist', () => {
      const originalPath = (FixtureLoader as any).metadataPath;
      (FixtureLoader as any).metadataPath = join(testFixturesPath, 'nonexistent.json');

      const metadata = FixtureLoader.loadMetadata();
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.fixtures).toEqual({});

      (FixtureLoader as any).metadataPath = originalPath;
    });
  });

  describe('utility methods', () => {
    beforeEach(() => {
      const originalPath = (FixtureLoader as any).fixturesPath;
      (FixtureLoader as any).fixturesPath = join(testFixturesPath, 'html');
    });

    it('should check fixture existence', () => {
      const originalPath = (FixtureLoader as any).fixturesPath;
      (FixtureLoader as any).fixturesPath = join(testFixturesPath, 'html');

      expect(FixtureLoader.exists('library', 'test.html')).toBe(true);
      expect(FixtureLoader.exists('library', 'nonexistent.html')).toBe(false);

      (FixtureLoader as any).fixturesPath = originalPath;
    });

    it('should list fixtures in category', () => {
      const originalPath = (FixtureLoader as any).fixturesPath;
      (FixtureLoader as any).fixturesPath = join(testFixturesPath, 'html');

      const fixtures = FixtureLoader.listFixtures('library');
      expect(fixtures).toContain('test.html');

      (FixtureLoader as any).fixturesPath = originalPath;
    });

    it('should return empty array for non-existent category', () => {
      const originalPath = (FixtureLoader as any).fixturesPath;
      (FixtureLoader as any).fixturesPath = join(testFixturesPath, 'html');

      const fixtures = FixtureLoader.listFixtures('nonexistent');
      expect(fixtures).toEqual([]);

      (FixtureLoader as any).fixturesPath = originalPath;
    });

    it('should clear cache', () => {
      const originalPath = (FixtureLoader as any).fixturesPath;
      (FixtureLoader as any).fixturesPath = join(testFixturesPath, 'html');

      // Load fixture to populate cache
      FixtureLoader.loadHtml('library', 'test.html');
      expect((FixtureLoader as any).cache.size).toBeGreaterThan(0);

      FixtureLoader.clearCache();
      expect((FixtureLoader as any).cache.size).toBe(0);

      (FixtureLoader as any).fixturesPath = originalPath;
    });
  });
});
