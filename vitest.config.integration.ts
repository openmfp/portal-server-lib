import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['integration-tests/**/*.integration-spec.ts'],
    reporters: [
      'default',
      [
        'junit',
        { outputFile: 'test-run-reports/TEST-integration-tests-results.xml' },
      ],
    ],
  },
});
