
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock browser audio
class AudioMock {
  constructor() {
    this.volume = 1;
    this.currentTime = 0;
    this.preload = 'auto';
    this.muted = false;
  }
  
  play() {
    return Promise.resolve();
  }
  
  pause() {}
}

global.Audio = AudioMock;

// Mock browser functions and objects
global.window = {
  audioUnlocked: false,
  tabooCards: [],
  ImageProxy: {
    loadImage: jest.fn((img, src, fallback, onSuccess) => {
      onSuccess();
      return true;
    })
  }
};

global.document = {
  createElement: () => ({
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  })
};

// Mock Fancybox
global.Fancybox = {
  defaults: {},
  show: jest.fn()
};
