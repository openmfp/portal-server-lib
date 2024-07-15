import { baseConfig } from './base.jest.config';

module.exports = {
  ...baseConfig,
  rootDir: 'src',
  testRegex: '.spec.ts$',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputName: 'TEST-unit-tests-results.xml',
        outputDirectory: 'test-run-reports',
      },
    ],
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 95,
      statements: -10,
    },
  },
  coverageDirectory: '../test-run-reports/coverage/unit',
};
