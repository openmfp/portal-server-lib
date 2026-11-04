import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.spec.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'cobertura', 'lcov'],
      reportsDirectory: 'test-run-reports/coverage/unit',
      thresholds: {
        branches: 50,
        functions: 80,
        lines: 95,
        statements: -10,
      },
    },
  },
});
