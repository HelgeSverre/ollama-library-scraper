# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-01-01

### Changed

- Rename Makefile targets from `test-local-*` to `act-*` for GitHub Actions local testing
- Update TypeScript configuration with custom `typeRoots` for improved type resolution

### Dependencies

- Update turndown from ^7.2.0 to ^7.2.2
- Update @types/node from ^20.19.9 to ^20.19.27
- Update @types/turndown from ^5.0.5 to ^5.0.6
- Update msw from ^2.10.4 to ^2.12.7
- Update prettier from ^3.6.2 to ^3.7.4
- Update typescript from ^5.9.2 to ^5.9.3

## [1.0.0] - 2025-01-XX

### Added

- Initial public release
- Core scraping functionality for Ollama library
- TypeScript definitions and comprehensive type definitions
- Comprehensive test coverage with fixtures
- Documentation and examples
- Model listing with search and sort capabilities
- Model details extraction including README content
- Model tags and variants information
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

[Unreleased]: https://github.com/helgesverre/ollama-library-scraper/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/helgesverre/ollama-library-scraper/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/helgesverre/ollama-library-scraper/releases/tag/v1.0.0
