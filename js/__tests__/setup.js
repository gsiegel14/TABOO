
require('@testing-library/jest-dom');

global.window = {
  location: {
    search: ''
  }
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
