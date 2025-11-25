import baseConfig from './base.jest.config.cjs';

export default {
  ...baseConfig,
  rootDir: 'src',
  testRegex: '.spec.ts$',
  collectCoverage: true,
  reporters: ['default'],
  coverageThreshold: {
    global: {
      // branches have an issue that controllers only get 50% coverage despite
      // being covered 100% in the tests.
      branches: 80,
      functions: 80,
      lines: 95,
      statements: -14,
    },
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/integration-tests/'],
  coverageDirectory: '../test-run-reports/coverage/unit',
};
