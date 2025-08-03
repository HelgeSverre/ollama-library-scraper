# Local GitHub Actions Testing Guide

This guide explains how to test GitHub Actions workflows locally for the ollama-library-scraper project.

## Prerequisites

### Required Tools

1. **Docker** - Required for running act containers
   ```bash
   # macOS
   brew install docker
   # Or download from https://docker.com
   ```

2. **act** - GitHub Actions local runner
   ```bash
   # macOS
   brew install act
   
   # Linux
   curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
   
   # Windows (with Chocolatey)
   choco install act-cli
   ```

3. **make** (optional) - For convenience commands
   ```bash
   # macOS (usually pre-installed)
   xcode-select --install
   
   # Linux
   sudo apt-get install build-essential  # Ubuntu/Debian
   sudo yum install make gcc             # CentOS/RHEL
   ```

## Quick Start

### 1. Verify Setup
```bash
# Check if all tools are available
make test-local-check
# or
./scripts/test-workflows-local.sh check
```

### 2. Test CI Workflow (Fast)
```bash
# Test CI with Node.js 20.x only (recommended for development)
make test-local-ci
# or
./scripts/test-workflows-local.sh ci
```

### 3. Test Full CI Pipeline
```bash
# Test CI with all Node.js versions (16.x, 18.x, 20.x)
make test-local-ci-full
# or
./scripts/test-workflows-local.sh ci-full
```

## Available Commands

### Using Make (Recommended)
```bash
make help                    # Show all available commands
make test-local-check        # Check dependencies
make test-local-ci           # Quick CI test (Node.js 20.x)
make test-local-ci-full      # Full CI test (all Node.js versions)
make test-local-release      # Test release workflow
make test-local-deps         # Test dependency review
make test-local-validate     # Validate workflow syntax
make test-local-clean        # Clean up artifacts
```

### Using Scripts Directly
```bash
./scripts/test-workflows-local.sh help      # Show script help
./scripts/test-workflows-local.sh check     # Check dependencies
./scripts/test-workflows-local.sh ci        # Quick CI test
./scripts/test-workflows-local.sh ci-full   # Full CI test
./scripts/test-workflows-local.sh job test  # Test specific job
./scripts/test-workflows-local.sh release   # Test release workflow
./scripts/test-workflows-local.sh validate  # Validate workflows
```

## Current Workflows

### 1. CI Workflow (.github/workflows/ci.yml)
- **Triggers**: Push to main/develop, PRs to main
- **Jobs**: 
  - `test`: Runs linting, tests, and build across Node.js 16.x, 18.x, 20.x
  - `package-audit`: Security audit and package validation
- **Local testing**: Uses Node.js 20.x by default for faster execution

### 2. Release Workflow (.github/workflows/release.yml)
- **Triggers**: Git tags starting with 'v'
- **Jobs**: 
  - `release`: Publishes to npm and creates GitHub release
- **Local testing**: Simulates release without actually publishing

### 3. Dependency Review (.github/workflows/dependency-review.yml)
- **Triggers**: Pull requests
- **Jobs**: 
  - `dependency-review`: Checks for security vulnerabilities and license issues
- **Local testing**: Uses mock PR event

## Testing Specific Scenarios

### Test Individual Jobs
```bash
# Test only the main test job
./scripts/test-workflows-local.sh job test

# Test only the package audit job
./scripts/test-workflows-local.sh job package-audit
```

### Test Release Simulation
```bash
# Simulate a release (dry-run, no actual publishing)
make test-local-release
```

### Validate Workflow Syntax
```bash
# Check all workflows for syntax errors
make test-local-validate
```

## Docker-based Testing

Alternative to act for more controlled testing:

```bash
# Build test container
make docker-build

# Run tests in container
make docker-test

# Manual container testing
docker run -it --rm ollama-library-scraper:test sh
```

## Configuration Files

### .actrc
Main configuration for act:
- Sets default Docker images
- Enables verbose logging
- Configures environment file usage

### .env.local
Environment variables for local testing:
- Skips external service calls (Codecov)
- Sets local testing flags
- Configures npm dry-run mode

### scripts/test-events/
Mock event files for testing specific triggers:
- `tag-push.json`: Simulates version tag creation
- `pull-request.json`: Simulates PR creation

## Best Practices

### 1. Fast Development Testing
```bash
# Quick validation during development
make test-local-check && make test-local-ci
```

### 2. Pre-commit Testing
```bash
# Validate everything before committing
make test-local-validate
make test-local-ci
```

### 3. Release Preparation
```bash
# Test the full pipeline before tagging
make test-local-ci-full
make test-local-release
```

### 4. Cleanup
```bash
# Clean up after testing sessions
make test-local-clean
```

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Start Docker Desktop (macOS/Windows)
   # Or start Docker daemon (Linux)
   sudo systemctl start docker
   ```

2. **act not found**
   ```bash
   # Reinstall act
   brew reinstall act  # macOS
   ```

3. **Permission denied on scripts**
   ```bash
   # Make scripts executable
   chmod +x scripts/test-workflows-local.sh
   ```

4. **Large Docker images**
   ```bash
   # Clean up Docker images periodically
   make test-local-clean
   docker system prune -f
   ```

### Performance Tips

1. **Use single Node.js version for development**: `make test-local-ci`
2. **Use full matrix only before releases**: `make test-local-ci-full`
3. **Validate syntax frequently**: `make test-local-validate`
4. **Clean up regularly**: `make test-local-clean`

## Environment Variables

The following environment variables affect local testing:

- `LOCAL_TESTING=true`: Enables local-specific behavior
- `SKIP_CODECOV_UPLOAD=true`: Skips external service calls
- `NODE_ENV=test`: Sets test environment
- `COVERAGE_ENABLED=true`: Enables coverage collection
- `NPM_CONFIG_DRY_RUN=true`: Prevents actual npm publishing

## Integration with Development Workflow

### Pre-commit Hook Example
```bash
#!/bin/sh
# .git/hooks/pre-commit
make test-local-validate && make test-local-ci
```

### VS Code Tasks
Add to `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Test Workflows Locally",
      "type": "shell",
      "command": "make test-local-ci",
      "group": "test"
    }
  ]
}
```

## Additional Resources

- [act Documentation](https://github.com/nektos/act)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)