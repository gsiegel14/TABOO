
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/js/__tests__/setup.js'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/js/__tests__/mocks/fileMock.js',
    '\\.(css|less)$': '<rootDir>/js/__tests__/mocks/styleMock.js'
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  verbose: true
};
