import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface FixtureMetadata {
  url: string;
  fetchedAt: string;
  description: string;
  modelCount?: number;
  tagCount?: number;
}

export interface FixturesMetadata {
  version: string;
  lastUpdated: string;
  fixtures: Record<string, FixtureMetadata>;
}

export class FixtureLoader {
  private static fixturesPath = join(__dirname, '../fixtures/html');
  private static metadataPath = join(__dirname, '../fixtures/metadata/fixtures.json');
  private static cache = new Map<string, string>();

  /**
   * Load an HTML fixture from the filesystem
   * @param category - The fixture category (library, models)
   * @param filename - The fixture filename
   * @returns The HTML content as a string
   */
  static loadHtml(category: string, filename: string): string {
    const cacheKey = `${category}/${filename}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const filepath = join(this.fixturesPath, category, filename);

    if (!existsSync(filepath)) {
      throw new Error(`Fixture not found: ${filepath}`);
    }

    const content = readFileSync(filepath, 'utf-8');
    this.cache.set(cacheKey, content);

    return content;
  }

  /**
   * Load expected data for a fixture
   * @param filename - The expected data filename
   * @returns The expected data object
   */
  static loadExpectedData<T>(filename: string): T {
    const filepath = join(__dirname, '../fixtures/expected', filename);

    if (!existsSync(filepath)) {
      throw new Error(`Expected data not found: ${filepath}`);
    }

    const content = readFileSync(filepath, 'utf-8');
    return JSON.parse(content) as T;
  }

  /**
   * Load fixture metadata
   * @returns The fixtures metadata object
   */
  static loadMetadata(): FixturesMetadata {
    if (!existsSync(this.metadataPath)) {
      return {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        fixtures: {},
      };
    }

    const content = readFileSync(this.metadataPath, 'utf-8');
    return JSON.parse(content) as FixturesMetadata;
  }

  /**
   * Get metadata for a specific fixture
   * @param category - The fixture category
   * @param filename - The fixture filename
   * @returns The fixture metadata or undefined if not found
   */
  static getFixtureMetadata(category: string, filename: string): FixtureMetadata | undefined {
    const metadata = this.loadMetadata();
    const key = `${category}/${filename}`;
    return metadata.fixtures[key];
  }

  /**
   * Clear the fixture cache
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Check if a fixture exists
   * @param category - The fixture category
   * @param filename - The fixture filename
   * @returns True if the fixture exists
   */
  static exists(category: string, filename: string): boolean {
    const filepath = join(this.fixturesPath, category, filename);
    return existsSync(filepath);
  }

  /**
   * List all fixtures in a category
   * @param category - The fixture category
   * @returns Array of fixture filenames
   */
  static listFixtures(category: string): string[] {
    const categoryPath = join(this.fixturesPath, category);

    if (!existsSync(categoryPath)) {
      return [];
    }

    const { readdirSync, statSync } = require('fs');
    const files: string[] = [];

    function scanDir(dir: string, prefix = ''): void {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scanDir(fullPath, prefix ? `${prefix}/${entry}` : entry);
        } else if (entry.endsWith('.html')) {
          files.push(prefix ? `${prefix}/${entry}` : entry);
        }
      }
    }

    scanDir(categoryPath);
    return files;
  }
}

export default FixtureLoader;
