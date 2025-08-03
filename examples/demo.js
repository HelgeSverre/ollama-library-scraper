#!/usr/bin/env node

/**
 * Ollama Library Scraper Demo
 * 
 * This script demonstrates all the main features of the ollama-library-scraper library:
 * - getModelListing() with various search and sort options
 * - getModelDetails() for specific models
 * - getModelTags() for model variants
 * 
 * Usage:
 *   node demo.js
 *   # or make it executable:
 *   chmod +x demo.js && ./demo.js
 * 
 * The script outputs formatted JSON to the console and includes comprehensive error handling.
 */

const { OllamaScraper } = require('../dist/index.js');

// Utility function to format JSON output with colors (if supported)
function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
}

// Utility function to create section headers
function printHeader(title) {
    console.log('\n' + '='.repeat(60));
    console.log(`  ${title}`);
    console.log('='.repeat(60));
}

// Utility function to print subsection headers
function printSubheader(title) {
    console.log('\n' + '-'.repeat(40));
    console.log(`  ${title}`);
    console.log('-'.repeat(40));
}

// Main demo function
async function runDemo() {
    console.log('🚀 Ollama Library Scraper Demo');
    console.log('This demo showcases all main features of the library.');
    
    const scraper = new OllamaScraper();
    
    try {
        // =================================================================
        // DEMO 1: Basic Model Listing
        // =================================================================
        printHeader('1. Basic Model Listing');
        console.log('Fetching the first 5 models from the library...');
        
        const basicListing = await scraper.getModelListing();
        console.log(`\nFound ${basicListing.length} total models`);
        console.log('\nFirst 5 models:');
        console.log(formatJSON(basicListing.slice(0, 5)));
        
        // =================================================================
        // DEMO 2: Search with Query
        // =================================================================
        printHeader('2. Model Search');
        
        printSubheader('Search for "llama" models');
        const llamaModels = await scraper.getModelListing({ 
            query: 'llama' 
        });
        console.log(`Found ${llamaModels.length} models matching "llama"`);
        console.log(formatJSON(llamaModels.slice(0, 3)));
        
        printSubheader('Search for "coding" models');
        const codingModels = await scraper.getModelListing({ 
            query: 'coding' 
        });
        console.log(`Found ${codingModels.length} models matching "coding"`);
        console.log(formatJSON(codingModels.slice(0, 2)));
        
        // =================================================================
        // DEMO 3: Different Sort Options
        // =================================================================
        printHeader('3. Sorting Options');
        
        printSubheader('Most Popular Models');
        const popularModels = await scraper.getModelListing({ 
            sort: 'most-popular' 
        });
        console.log('Top 3 most popular models:');
        console.log(formatJSON(popularModels.slice(0, 3)));
        
        printSubheader('Newest Models');
        const newestModels = await scraper.getModelListing({ 
            sort: 'newest' 
        });
        console.log('Top 3 newest models:');
        console.log(formatJSON(newestModels.slice(0, 3)));
        
        printSubheader('Alphabetical Order');
        const alphabeticalModels = await scraper.getModelListing({ 
            sort: 'alphabetical' 
        });
        console.log('First 3 models alphabetically:');
        console.log(formatJSON(alphabeticalModels.slice(0, 3)));
        
        // =================================================================
        // DEMO 4: Combined Search and Sort
        // =================================================================
        printHeader('4. Combined Search and Sort');
        console.log('Searching for "qwen" models, sorted by newest...');
        
        const qwenNewest = await scraper.getModelListing({
            query: 'qwen',
            sort: 'newest'
        });
        console.log(`Found ${qwenNewest.length} "qwen" models`);
        console.log(formatJSON(qwenNewest.slice(0, 2)));
        
        // =================================================================
        // DEMO 5: Model Details
        // =================================================================
        printHeader('5. Model Details');
        
        // Pick a model from our search results for detailed examination
        const modelToExamine = qwenNewest.length > 0 ? qwenNewest[0].name : 'llama3.2';
        
        printSubheader(`Details for "${modelToExamine}"`);
        console.log(`Fetching detailed information for model: ${modelToExamine}`);
        
        const modelDetails = await scraper.getModelDetails(modelToExamine);
        console.log(formatJSON(modelDetails));
        
        // =================================================================
        // DEMO 6: Model Tags
        // =================================================================
        printHeader('6. Model Tags');
        
        printSubheader(`Tags for "${modelToExamine}"`);
        console.log(`Fetching all available tags for model: ${modelToExamine}`);
        
        const modelTags = await scraper.getModelTags(modelToExamine);
        console.log(`Found ${modelTags.length} tags for ${modelToExamine}`);
        console.log(formatJSON(modelTags));
        
        // =================================================================
        // DEMO 7: Specific Tag Details
        // =================================================================
        if (modelTags.length > 0) {
            printHeader('7. Specific Tag Details');
            
            const specificTag = modelTags[0].name;
            printSubheader(`Details for "${modelToExamine}:${specificTag}"`);
            console.log(`Fetching details for specific tag: ${modelToExamine}:${specificTag}`);
            
            const tagDetails = await scraper.getModelDetails(modelToExamine, specificTag);
            console.log(formatJSON(tagDetails));
        }
        
        // =================================================================
        // DEMO 8: Capability Filtering Example
        // =================================================================
        printHeader('8. Capability Analysis');
        console.log('Analyzing models by capabilities...');
        
        const allModels = await scraper.getModelListing();
        
        // Filter models by capabilities
        const visionModels = allModels.filter(model => 
            model.capabilities && model.capabilities.includes('vision')
        );
        const toolModels = allModels.filter(model => 
            model.capabilities && model.capabilities.includes('tools')
        );
        const embeddingModels = allModels.filter(model => 
            model.capabilities && model.capabilities.includes('embedding')
        );
        
        console.log(`\nModels with Vision capability: ${visionModels.length}`);
        if (visionModels.length > 0) {
            console.log(formatJSON(visionModels.slice(0, 2)));
        }
        
        console.log(`\nModels with Tools capability: ${toolModels.length}`);
        if (toolModels.length > 0) {
            console.log(formatJSON(toolModels.slice(0, 2)));
        }
        
        console.log(`\nModels with Embedding capability: ${embeddingModels.length}`);
        if (embeddingModels.length > 0) {
            console.log(formatJSON(embeddingModels.slice(0, 2)));
        }
        
        // =================================================================
        // DEMO COMPLETE
        // =================================================================
        printHeader('Demo Complete!');
        console.log('✅ Successfully demonstrated all main features:');
        console.log('   • Basic model listing');
        console.log('   • Search functionality');
        console.log('   • Sort options (newest, most-popular, alphabetical)');
        console.log('   • Combined search and sort');
        console.log('   • Detailed model information');
        console.log('   • Model tags listing');
        console.log('   • Specific tag details');
        console.log('   • Capability analysis');
        console.log('\n🎉 The ollama-library-scraper is working correctly!');
        
    } catch (error) {
        console.error('\n❌ Demo failed with error:');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        
        // Provide helpful debugging information
        console.error('\n🔧 Debugging tips:');
        console.error('1. Check your internet connection');
        console.error('2. Verify that ollama.com is accessible');
        console.error('3. Ensure the library is properly installed (npm install)');
        console.error('4. Try running the build command: npm run build');
        
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('\n❌ Unhandled promise rejection:');
    console.error(error);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('\n❌ Uncaught exception:');
    console.error(error);
    process.exit(1);
});

// Run the demo
if (require.main === module) {
    console.log('Starting demo...\n');
    runDemo().catch(error => {
        console.error('Failed to run demo:', error);
        process.exit(1);
    });
}

module.exports = { runDemo };