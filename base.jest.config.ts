const baseConfig = {
  testEnvironment: 'node',
  coverageReporters: ['text', 'cobertura', 'lcov'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};

export { baseConfig };
