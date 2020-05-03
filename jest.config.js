module.exports = {
  displayName: 'bull-reloadable-config',
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/types/**',
    '!<rootDir>/src/__tests__/**',
    '!<rootDir>/src/plugins/apm/*.ts',
    '!<rootDir>/src/src',
  ],
  coverageReporters: ['html', 'text'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  reporters: ['default'],
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  globals: {
    'ts-jest': {
      babelConfig: true,
    },
  },
};
