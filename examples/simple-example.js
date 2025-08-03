#!/usr/bin/env node

/**
 * Simple Example - Quick Template
 *
 * A minimal example showing basic usage of the ollama-library-scraper.
 * Use this as a starting point for your own scripts.
 */

const { OllamaScraper } = require('../dist/index.js');

async function main() {
  const scraper = new OllamaScraper();

  try {
    console.log('🔍 Searching for popular models...\n');

    // Get the most popular models
    const popularModels = await scraper.getModelListing({
      sort: 'most-popular',
    });

    console.log(`Found ${popularModels.length} models total`);
    console.log('\nTop 3 most popular models:');

    popularModels.slice(0, 3).forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Downloads: ${model.pulls}`);
      console.log(`   Description: ${model.description}`);
      if (model.capabilities) {
        console.log(`   Capabilities: ${model.capabilities.join(', ')}`);
      }
      console.log('');
    });

    // Get details for the first model
    if (popularModels.length > 0) {
      const firstModel = popularModels[0];
      console.log(`📋 Getting details for "${firstModel.name}"...\n`);

      const details = await scraper.getModelDetails(firstModel.name);
      console.log(`Model: ${details.name}`);
      console.log(`Downloads: ${details.downloads}`);
      console.log(`Available variants: ${details.models.length}`);

      if (details.models.length > 0) {
        console.log('\nAvailable model variants:');
        details.models.forEach(model => {
          console.log(`  • ${model.name} (${model.size})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the example
main();
