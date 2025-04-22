/**
 * Taboo Game UI and Image Loading Tests
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

require('../card-data.js');

describe('Card Image Tests', () => {
  let imageErrors = [];

  beforeAll(() => {
    global.window = {
      tabooCards: require('../card-data.js').tabooCards
    };
  });

  test('All card images exist and are accessible', () => {
    const imageErrors = [];
    window.tabooCards.forEach(card => {
      if (card.target_img) {
        const imgPath = path.resolve(__dirname, '../../', card.target_img);
        const exists = fs.existsSync(imgPath);
        if (!exists) {
          imageErrors.push(`Missing target image for card ${card.id}: ${card.target_img}`);
        }
      }

      if (card.probe_img) {
        const imgPath = path.resolve(__dirname, '../../', card.probe_img);
        const exists = fs.existsSync(imgPath);
        if (!exists) {
          imageErrors.push(`Missing probe image for card ${card.id}: ${card.probe_img}`);
        }
      }
    });
    
    if (imageErrors.length > 0) {
      console.error('Image errors found:', imageErrors);
      fail(imageErrors.join('\n'));
    }
  });

test('Audio files exist and are accessible', () => {
    const audioFiles = [
      'sounds/beep-short.mp3',
      'sounds/beep-long.mp3',
      'sounds/correct.mp3',
      'sounds/wrong.mp3',
      'sounds/flip.mp3'
    ];
    
    const missingAudio = [];
    audioFiles.forEach(file => {
      const exists = fs.existsSync(path.resolve(__dirname, '../../', file));
      if (!exists) {
        missingAudio.push(`Missing audio file: ${file}`);
      }
    });
    
    if (missingAudio.length > 0) {
      console.error('Audio errors found:', missingAudio);
      fail(missingAudio.join('\n'));
    }
  });

  test('Audio files exist', () => {
    const audioFiles = [
      'sounds/beep-short.mp3',
      'sounds/beep-long.mp3',
      'sounds/correct.mp3',
      'sounds/wrong.mp3',
      'sounds/flip.mp3'
    ];

    audioFiles.forEach(file => {
      const exists = fs.existsSync(path.resolve(__dirname, '../../', file));
      expect(exists).toBeTruthy();
    });
  });

  test('Card data structure is valid', () => {
    window.tabooCards.forEach((card, index) => {
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('target_img');
      expect(card).toHaveProperty('probe_img');
      expect(typeof card.id).toBe('number');
      expect(typeof card.target_img).toBe('string');
      expect(typeof card.probe_img).toBe('string');
    });
  });
});

describe('Taboo Game Tests', () => {
  beforeAll(() => {
    global.window = new JSDOM().window;
    require('../card-data.js');
  });

  beforeEach(() => {
    // Mock card data - simplified using beforeAll hook
  });

  // UI Element Tests
  describe('UI Elements', () => {
    test('Timer controls exist and are clickable', () => {
      const startBtn = document.getElementById('start-timer');
      const pauseBtn = document.getElementById('pause-timer');
      const resetBtn = document.getElementById('reset-timer');

      expect(startBtn).toBeTruthy();
      expect(pauseBtn).toBeTruthy();
      expect(resetBtn).toBeTruthy();
    });

    test('Score controls exist for both teams', () => {
      const team1Plus = document.getElementById('team1-plus');
      const team1Minus = document.getElementById('team1-minus');
      const team2Plus = document.getElementById('team2-plus');
      const team2Minus = document.getElementById('team2-minus');

      expect(team1Plus).toBeTruthy();
      expect(team1Minus).toBeTruthy();
      expect(team2Plus).toBeTruthy();
      expect(team2Minus).toBeTruthy();
    });

    test('Card navigation buttons exist', () => {
      const prevBtn = document.getElementById('prev-card');
      const nextBtn = document.getElementById('next-card');

      expect(prevBtn).toBeTruthy();
      expect(nextBtn).toBeTruthy();
    });
  });

  // Card and Image Tests (from edited code)
  describe('Card and Image Tests', () => {
    test('All 35 cards are present', () => {
      expect(window.tabooCards.length).toBe(35);
    });

    test('All cards have required properties', () => {
      window.tabooCards.forEach(card => {
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('target_img');
        expect(card).toHaveProperty('probe_img');
        expect(card).toHaveProperty('prompt');
        expect(card).toHaveProperty('tabooWords');
      });
    });

    test('All image files exist', () => {
      const imageErrors = [];

      window.tabooCards.forEach(card => {
        const paths = {
          target: [
            `images/cards/local/${card.id}_target_${path.basename(card.target_img)}`,
            card.target_img
          ],
          probe: [
            `images/cards/local/${card.id}_probe_${path.basename(card.probe_img)}`,
            card.probe_img
          ]
        };

        const targetExists = paths.target.some(p =>
          fs.existsSync(path.resolve(__dirname, '../../', p))
        );
        const probeExists = paths.probe.some(p =>
          fs.existsSync(path.resolve(__dirname, '../../', p))
        );

        if (!targetExists) {
          imageErrors.push(`Card ${card.id}: Missing target image`);
        }
        if (!probeExists) {
          imageErrors.push(`Card ${card.id}: Missing probe image`);
        }
      });

      expect(imageErrors).toHaveLength(0);
    });

    test('All audio files exist', () => {
      const audioFiles = [
        'sounds/correct.mp3',
        'sounds/wrong.mp3',
        'sounds/flip.mp3'
      ];

      audioFiles.forEach(file => {
        expect(fs.existsSync(path.resolve(__dirname, '../../', file))).toBe(true);
      });
    });
  });


  // Card Display Tests
  describe('Card Display', () => {
    test('Card displays correctly when navigating', () => {
      // Initialize game
      window.initGame();

      const targetWord = document.getElementById('target-word');
      const cardTargetImg = document.getElementById('card-target-img');
      const cardProbeImg = document.getElementById('card-probe-img');

      expect(targetWord).toBeTruthy();
      expect(cardTargetImg).toBeTruthy();
      expect(cardProbeImg).toBeTruthy();

      // Test card navigation
      const nextBtn = document.getElementById('next-card');
      nextBtn.click();

      expect(targetWord.textContent).toBe(window.tabooCards[1].targetWord);
    });
  });

  describe('UI Functionality', () => {
    test('Card container exists', () => {
      const container = document.getElementById('card-container');
      expect(container).not.toBeNull();
    });

    test('Flip button exists', () => {
      const button = document.getElementById('flip-button');
      expect(button).not.toBeNull();
    });

    test('Audio elements exist', () => {
      const audioElements = document.querySelectorAll('audio');
      expect(audioElements.length).toBeGreaterThan(0);
    });
  });
});