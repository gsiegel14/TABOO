
module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  testEnvironmentOptions: {
    url: 'http://localhost'
  }
};
