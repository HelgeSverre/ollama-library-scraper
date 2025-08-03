import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000, // 10 seconds for network-related tests
    hookTimeout: 10000,
    teardownTimeout: 5000,
    // Enable concurrent testing for performance tests
    maxConcurrency: 5,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      },
      exclude: [
        'node_modules/**',
        'dist/**',
        'vitest.config.ts',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'src/scripts/**',
        'src/types/**'
      ],
      include: [
        'src/**/*.ts'
      ]
    },
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.ts'
    ],
    // Setup files (none required currently)
    setupFiles: [],
    // Reporter configuration
    reporters: process.env.CI ? ['junit', 'github-actions'] : ['verbose'],
    outputFile: {
      junit: './test-results.xml'
    },
  }
});