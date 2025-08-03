# Ollama Library Scraper - Local Development and Testing

.PHONY: help install test build lint format clean test-local-* docker-*

# Default target
help:
	@echo "Ollama Library Scraper - Development Commands"
	@echo ""
	@echo "Development:"
	@echo "  install              Install dependencies"
	@echo "  test                 Run tests"
	@echo "  test-watch           Run tests in watch mode"
	@echo "  test-coverage        Run tests with coverage"
	@echo "  build                Build the project"
	@echo "  lint                 Run linting and formatting checks"
	@echo "  format               Format code"
	@echo "  clean                Clean build artifacts"
	@echo ""
	@echo "Local GitHub Actions Testing:"
	@echo "  test-local-check     Check if act and Docker are installed"
	@echo "  test-local-ci        Test CI workflow locally (fast)"
	@echo "  test-local-ci-full   Test CI workflow with all Node.js versions"
	@echo "  test-local-release   Test release workflow (dry-run)"
	@echo "  test-local-deps      Test dependency review workflow"
	@echo "  test-local-validate  Validate workflow syntax"
	@echo "  test-local-clean     Clean up local testing artifacts"
	@echo ""
	@echo "Docker:"
	@echo "  docker-build         Build Docker image for testing"
	@echo "  docker-test          Run tests in Docker container"
	@echo ""
	@echo "Release:"
	@echo "  release-patch        Create patch release"
	@echo "  release-minor        Create minor release"
	@echo "  release-major        Create major release"

# Development commands
install:
	npm ci

test:
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

build:
	npm run build

lint:
	npm run lint

format:
	npm run format

clean:
	npm run clean

# Local GitHub Actions testing commands
test-local-check:
	@./scripts/test-workflows-local.sh check

test-local-ci:
	@./scripts/test-workflows-local.sh ci

test-local-ci-full:
	@./scripts/test-workflows-local.sh ci-full

test-local-release:
	@./scripts/test-workflows-local.sh release

test-local-deps:
	@./scripts/test-workflows-local.sh deps

test-local-validate:
	@./scripts/test-workflows-local.sh validate

test-local-clean:
	@./scripts/test-workflows-local.sh clean

# Docker commands for containerized testing
docker-build:
	docker build -t ollama-library-scraper:test \
		--target test \
		--build-arg NODE_VERSION=20 \
		-f Dockerfile.test .

docker-test:
	@if [ -d "$(PWD)/coverage" ]; then rm -rf $(PWD)/coverage; fi
	@echo "Running tests in Docker container..."
	@docker run --name ollama-test-temp ollama-library-scraper:test || true
	@echo "Copying coverage reports from container..."
	@docker cp ollama-test-temp:/app/coverage . 2>/dev/null || echo "No coverage directory to copy"
	@docker rm ollama-test-temp 2>/dev/null || true

# Release commands
release-patch:
	npm run release:patch

release-minor:
	npm run release:minor

release-major:
	npm run release:major

# Convenience targets
ci-local: test-local-ci
validate: test-local-validate
test-all: test test-local-ci