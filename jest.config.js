/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  setupFilesAfterEnv: ['<rootDir>/../jest.setup.js'],
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  coverageReporters: ['text', 'cobertura', 'lcov'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
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
  rootDir: 'src',
  testRegex: '.spec.ts$',
  collectCoverage: true,
  reporters: ['default'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 80,
      lines: 95,
      statements: -9,
    },
  },
  coveragePathIgnorePatterns: ['/node_modules/', '/integration-tests/'],
  coverageDirectory: '../test-run-reports/coverage/unit',
};
