# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of ollama-library-scraper
- TypeScript support with comprehensive type definitions
- Model listing with search and sort capabilities
- Model details extraction including README content
- Model tags and variants information
- Comprehensive test suite with fixtures
- Performance and edge case testing
- GitHub Actions CI/CD workflows
- VS Code configuration for optimal development experience

### Features

- `getModelListing()` - Get list of models with optional search and sorting
- `getModelDetails()` - Get detailed information about specific models
- `getModelTags()` - Get all tags/variants for a model
- Full TypeScript support with exported types
- Support for model capabilities (vision, tools, thinking, embedding)
- Cheerio-based HTML parsing for reliable data extraction
- Turndown integration for Markdown conversion

## [1.0.0] - 2025-01-XX

### Added

- Initial public release
- Core scraping functionality for Ollama library
- TypeScript definitions
- Comprehensive test coverage
- Documentation and examples

[Unreleased]: https://github.com/helgesverre/ollama-library-scraper/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/helgesverre/ollama-library-scraper/releases/tag/v1.0.0
