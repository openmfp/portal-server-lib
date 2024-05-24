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
  coverageDirectory: '../test-run-reports/coverage/unit',
};
