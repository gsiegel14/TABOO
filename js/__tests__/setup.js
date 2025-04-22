
require('@testing-library/jest-dom');

global.window = {
  location: {
    search: ''
  },
  tabooCards: require('../card-data.js').tabooCards
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

global.document = {
  getElementById: () => ({
    style: {},
    classList: {
      add: () => {},
      remove: () => {}
    }
  })
};
