#!/bin/bash

# Local GitHub Actions Testing Script
# This script provides commands to test workflows locally using act

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if act is installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v act &> /dev/null; then
        print_error "act is not installed. Please install it first:"
        echo "  macOS: brew install act"
        echo "  Linux: curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not running. act requires Docker."
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# List available workflows
list_workflows() {
    print_status "Available workflows:"
    echo "  1. ci.yml - Main CI pipeline (test, lint, build)"
    echo "  2. release.yml - Release workflow (npm publish)"
    echo "  3. dependency-review.yml - Dependency security check"
}

# Test CI workflow
test_ci() {
    print_status "Testing CI workflow locally..."
    
    # Test with single Node.js version for faster execution
    print_status "Running CI with Node.js 20.x (fastest option)..."
    act -W .github/workflows/ci.yml \
        --matrix node-version:20.x \
        --env-file .env.local \
        --artifact-server-path ./artifacts
}

# Test CI workflow with all Node.js versions
test_ci_full() {
    print_status "Testing CI workflow with all Node.js versions..."
    print_warning "This will take longer as it tests Node.js 16.x, 18.x, and 20.x"
    
    act -W .github/workflows/ci.yml \
        --env-file .env.local \
        --artifact-server-path ./artifacts
}

# Test specific job
test_job() {
    local job_name="$1"
    if [ -z "$job_name" ]; then
        print_error "Please specify a job name"
        echo "Available jobs: test, package-audit"
        exit 1
    fi
    
    print_status "Testing job: $job_name"
    act -W .github/workflows/ci.yml \
        --job "$job_name" \
        --env-file .env.local \
        --artifact-server-path ./artifacts
}

# Test release workflow (dry-run)
test_release() {
    print_status "Testing release workflow (dry-run)..."
    print_warning "This simulates a release but won't actually publish"
    
    # Simulate a tag push event
    act -W .github/workflows/release.yml \
        --eventpath scripts/test-events/tag-push.json \
        --env-file .env.local \
        --secret NPM_TOKEN="dummy-token-for-testing"
}

# Test dependency review
test_dependency_review() {
    print_status "Testing dependency review workflow..."
    
    act -W .github/workflows/dependency-review.yml \
        --eventpath scripts/test-events/pull-request.json
}

# Validate all workflows without running
validate_workflows() {
    print_status "Validating workflow syntax..."
    
    for workflow in .github/workflows/*.yml; do
        print_status "Validating $(basename "$workflow")..."
        act -W "$workflow" --list > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_success "✓ $(basename "$workflow") is valid"
        else
            print_error "✗ $(basename "$workflow") has syntax errors"
        fi
    done
}

# Clean up artifacts and Docker images
cleanup() {
    print_status "Cleaning up local testing artifacts..."
    
    # Remove artifact directory
    if [ -d "./artifacts" ]; then
        rm -rf ./artifacts
        print_success "Removed ./artifacts directory"
    fi
    
    # Clean up Docker images (optional)
    read -p "Remove act Docker images? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker image prune -f --filter label=org.opencontainers.image.source=https://github.com/catthehacker/docker_images
        print_success "Cleaned up Docker images"
    fi
}

# Main script logic
case "${1:-help}" in
    "check")
        check_dependencies
        ;;
    "list")
        list_workflows
        ;;
    "ci")
        check_dependencies
        test_ci
        ;;
    "ci-full")
        check_dependencies
        test_ci_full
        ;;
    "job")
        check_dependencies
        test_job "$2"
        ;;
    "release")
        check_dependencies
        test_release
        ;;
    "deps")
        check_dependencies
        test_dependency_review
        ;;
    "validate")
        check_dependencies
        validate_workflows
        ;;
    "clean")
        cleanup
        ;;
    "help"|*)
        echo "Local GitHub Actions Testing Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  check        - Check if required tools are installed"
        echo "  list         - List available workflows"
        echo "  ci           - Test CI workflow (Node.js 20.x only, fast)"
        echo "  ci-full      - Test CI workflow (all Node.js versions)"
        echo "  job [name]   - Test specific job (test, package-audit)"
        echo "  release      - Test release workflow (dry-run)"
        echo "  deps         - Test dependency review workflow"
        echo "  validate     - Validate workflow syntax without running"
        echo "  clean        - Clean up artifacts and Docker images"
        echo "  help         - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 check              # Check dependencies"
        echo "  $0 ci                 # Quick CI test"
        echo "  $0 job test           # Test only the 'test' job"
        echo "  $0 validate           # Check workflow syntax"
        ;;
esac