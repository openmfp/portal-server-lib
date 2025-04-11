/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  coverageReporters: ['text', 'cobertura', 'lcov'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '../tsconfig.test.json',
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@kubernetes/client-node|@nestjs/.*)/)',
  ],
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