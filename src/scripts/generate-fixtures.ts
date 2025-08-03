#!/usr/bin/env node

import fetch from 'node-fetch';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type { FixturesMetadata } from '../__tests__/helpers/fixture-loader';

interface FixtureDefinition {
  name: string;
  url: string;
  category: string;
  description: string;
}

const FIXTURES_TO_GENERATE: FixtureDefinition[] = [
  // Library listings
  {
    name: 'listing-newest.html',
    url: 'https://ollama.com/library?sort=newest',
    category: 'library',
    description: 'Library listing sorted by newest',
  },
  {
    name: 'listing-popular.html',
    url: 'https://ollama.com/library?sort=most-popular',
    category: 'library',
    description: 'Library listing sorted by most popular',
  },
  {
    name: 'listing-search-wizard.html',
    url: 'https://ollama.com/library?q=wizard',
    category: 'library',
    description: 'Search results for "wizard"',
  },
  {
    name: 'listing-search-no-results.html',
    url: 'https://ollama.com/library?q=xyzabc123notfound',
    category: 'library',
    description: 'Empty search results',
  },

  // Model details and tags
  {
    name: 'magistral/details.html',
    url: 'https://ollama.com/library/magistral',
    category: 'models',
    description: 'Magistral model details',
  },
  {
    name: 'magistral/tags.html',
    url: 'https://ollama.com/library/magistral/tags',
    category: 'models',
    description: 'Magistral model tags',
  },
  {
    name: 'granite-embedding/details.html',
    url: 'https://ollama.com/library/granite-embedding',
    category: 'models',
    description: 'Granite embedding model details',
  },
  {
    name: 'granite-embedding/tags.html',
    url: 'https://ollama.com/library/granite-embedding/tags',
    category: 'models',
    description: 'Granite embedding model tags',
  },
  {
    name: 'wizard-math/details.html',
    url: 'https://ollama.com/library/wizard-math',
    category: 'models',
    description: 'Wizard Math model details',
  },
  {
    name: 'wizard-math/tags.html',
    url: 'https://ollama.com/library/wizard-math/tags',
    category: 'models',
    description: 'Wizard Math model tags',
  },
  {
    name: 'wizard-vicuna-uncensored/details.html',
    url: 'https://ollama.com/library/wizard-vicuna-uncensored',
    category: 'models',
    description: 'Wizard Vicuna Uncensored model details',
  },
  {
    name: 'wizard-vicuna-uncensored/tags.html',
    url: 'https://ollama.com/library/wizard-vicuna-uncensored/tags',
    category: 'models',
    description: 'Wizard Vicuna Uncensored model tags',
  },

  // Specific tag variants for wizard-vicuna-uncensored
  {
    name: 'wizard-vicuna-uncensored/variants/13b-q4_K_M.html',
    url: 'https://ollama.com/library/wizard-vicuna-uncensored:13b-q4_K_M',
    category: 'models',
    description: 'Wizard Vicuna Uncensored 13b-q4_K_M variant',
  },
  {
    name: 'wizard-vicuna-uncensored/variants/13b-q8_0.html',
    url: 'https://ollama.com/library/wizard-vicuna-uncensored:13b-q8_0',
    category: 'models',
    description: 'Wizard Vicuna Uncensored 13b-q8_0 variant',
  },
  {
    name: 'wizard-vicuna-uncensored/variants/latest.html',
    url: 'https://ollama.com/library/wizard-vicuna-uncensored:latest',
    category: 'models',
    description: 'Wizard Vicuna Uncensored latest variant',
  },
];

class FixtureGenerator {
  private fixturesPath = join(__dirname, '../__tests__/fixtures/html');
  private metadataPath = join(__dirname, '../__tests__/fixtures/metadata/fixtures.json');
  private metadata: FixturesMetadata;

  constructor() {
    this.metadata = this.loadMetadata();
  }

  private loadMetadata(): FixturesMetadata {
    if (existsSync(this.metadataPath)) {
      const content = require('fs').readFileSync(this.metadataPath, 'utf-8');
      return JSON.parse(content);
    }

    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      fixtures: {},
    };
  }

  private saveMetadata(): void {
    const dir = dirname(this.metadataPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(this.metadataPath, JSON.stringify(this.metadata, null, 2));
  }

  private async fetchHtml(url: string): Promise<string> {
    console.log(`Fetching: ${url}`);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OllamaScraperFixtureGenerator/1.0)',
        },
      });

      if (!response.ok) {
        console.warn(`Warning: ${url} returned status ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  private saveFixture(category: string, filename: string, content: string): void {
    const filepath = join(this.fixturesPath, category, filename);
    const dir = dirname(filepath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filepath, content);
    console.log(`Saved: ${category}/${filename}`);
  }

  private updateMetadata(fixture: FixtureDefinition): void {
    const key = `${fixture.category}/${fixture.name}`;

    this.metadata.fixtures[key] = {
      url: fixture.url,
      fetchedAt: new Date().toISOString(),
      description: fixture.description,
    };

    this.metadata.lastUpdated = new Date().toISOString();
  }

  async generateFixture(fixture: FixtureDefinition): Promise<void> {
    try {
      const html = await this.fetchHtml(fixture.url);
      this.saveFixture(fixture.category, fixture.name, html);
      this.updateMetadata(fixture);
    } catch (error) {
      console.error(`Failed to generate fixture ${fixture.name}:`, error);
      throw error;
    }
  }

  async generateAllFixtures(update = false): Promise<void> {
    console.log('Generating fixtures...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const fixture of FIXTURES_TO_GENERATE) {
      const key = `${fixture.category}/${fixture.name}`;
      const filepath = join(this.fixturesPath, fixture.category, fixture.name);

      // Skip if fixture exists and we're not updating
      if (!update && existsSync(filepath)) {
        console.log(`Skipping existing fixture: ${key}`);
        successCount++;
        continue;
      }

      try {
        await this.generateFixture(fixture);
        successCount++;

        // Add a small delay to be respectful of the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        errorCount++;
      }
    }

    this.saveMetadata();

    console.log('\n=== Summary ===');
    console.log(`Successfully generated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total fixtures: ${FIXTURES_TO_GENERATE.length}`);
  }

  async generateCategory(category: string): Promise<void> {
    const fixtures = FIXTURES_TO_GENERATE.filter(f => f.category === category);

    if (fixtures.length === 0) {
      console.error(`No fixtures found for category: ${category}`);
      return;
    }

    console.log(`Generating ${fixtures.length} fixtures for category: ${category}\n`);

    for (const fixture of fixtures) {
      try {
        await this.generateFixture(fixture);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // Continue with next fixture
      }
    }

    this.saveMetadata();
  }

  listFixtures(): void {
    console.log('Available fixtures:\n');

    const byCategory = FIXTURES_TO_GENERATE.reduce(
      (acc, fixture) => {
        if (!acc[fixture.category]) {
          acc[fixture.category] = [];
        }
        acc[fixture.category].push(fixture);
        return acc;
      },
      {} as Record<string, FixtureDefinition[]>
    );

    for (const [category, fixtures] of Object.entries(byCategory)) {
      console.log(`\n${category}:`);
      for (const fixture of fixtures) {
        const key = `${fixture.category}/${fixture.name}`;
        const exists = existsSync(join(this.fixturesPath, fixture.category, fixture.name));
        const metadata = this.metadata.fixtures[key];
        const status = exists ? '✓' : '✗';
        const date = metadata?.fetchedAt
          ? new Date(metadata.fetchedAt).toLocaleDateString()
          : 'never';

        console.log(`  ${status} ${fixture.name} - ${fixture.description} (last: ${date})`);
      }
    }
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const generator = new FixtureGenerator();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Ollama Scraper Fixture Generator

Usage:
  npm run fixtures:generate              Generate all missing fixtures
  npm run fixtures:generate -- --update  Update all fixtures
  npm run fixtures:generate -- --category=library  Generate library fixtures only
  npm run fixtures:generate -- --category=models   Generate models fixtures only
  npm run fixtures:generate -- --list    List all fixtures and their status
`);
    return;
  }

  if (args.includes('--list')) {
    generator.listFixtures();
    return;
  }

  const categoryArg = args.find(arg => arg.startsWith('--category='));
  if (categoryArg) {
    const category = categoryArg.split('=')[1];
    await generator.generateCategory(category);
    return;
  }

  const update = args.includes('--update');
  await generator.generateAllFixtures(update);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { FixtureGenerator, FixtureDefinition };
