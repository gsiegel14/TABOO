
require('@testing-library/jest-dom');
const fs = require('fs');
const path = require('path');

global.window = {
  location: {
    search: ''
  },
  tabooCards: require('../card-data.js').tabooCards,
  ImageProxy: {
    loadImage: jest.fn((img, src, fallback, onSuccess) => {
      // Always succeed for test purposes
      onSuccess();
      return true;
    })
  },
  playSound: jest.fn()
};

global.document = {
  getElementById: jest.fn().mockReturnValue({
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  }),
  createElement: jest.fn().mockReturnValue({
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  })
};

global.Image = class {
  constructor() {
    setTimeout(() => this.onload && this.onload());
  }
};

global.Audio = class {
  constructor() {
    setTimeout(() => this.oncanplaythrough && this.oncanplaythrough());
  }
  play() { return Promise.resolve(); }
};

// Mock file system for image tests
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn()
}));
