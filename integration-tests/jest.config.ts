const baseConfig = require('../jest.base.config.cjs');

module.exports = {
  ...baseConfig,
  rootDir: '..',
  testRegex: '.integration-spec.ts$',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputName: 'TEST-integration-tests-results.xml',
        outputDirectory: 'test-run-reports',
      },
    ],
  ],
  coverageDirectory: 'test-run-reports/coverage/integration',
};
