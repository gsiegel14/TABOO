
module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/js/__tests__/setup.js'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/__mocks__/styleMock.js'
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true
};
