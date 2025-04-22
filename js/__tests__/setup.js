
const { TextEncoder, TextDecoder } = require('util');
const { JSDOM } = require('jsdom');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Audio = class {
  constructor() {
    this.volume = 1;
    this.currentTime = 0;
    this.preload = 'auto';
    this.muted = false;
  }
  play() { return Promise.resolve(); }
  pause() {}
};

// Mock card data and functions
global.window.tabooCards = [];
global.window.ImageProxy = {
  loadImage: jest.fn((img, src, fallback, onSuccess) => {
    onSuccess();
    return true;
  })
};

// Mock DOM elements
document.body.innerHTML = `
  <div id="card-container"></div>
  <button id="prev-card">Previous</button>
  <button id="next-card">Next</button>
  <div id="target-word"></div>
  <img id="card-target-img" />
  <img id="card-probe-img" />
`;

// Mock Fancybox
global.Fancybox = {
  defaults: {},
  show: jest.fn()
};
