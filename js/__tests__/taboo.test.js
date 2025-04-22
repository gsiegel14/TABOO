/**
 * Taboo Game UI and Image Loading Tests
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment
document.body.innerHTML = `
  <div id="card-container"></div>
  <button id="flip-button"></button>
  <audio id="flip-sound"></audio>
  <audio id="correct-sound"></audio>
  <audio id="wrong-sound"></audio>
`;

describe('Taboo Game Tests', () => {
  let document;
  let window;

  beforeEach(() => {
    document.body.innerHTML = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

    // Mock card data
    window.tabooCards = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../card-data.js'), 'utf8')
      .replace('const tabooCards =', '')
      .replace(/;.*$/, ''));
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

  // Image Loading Tests
  describe('Image Loading', () => {
    test('All target images exist', () => {
      const imageErrors = [];
      window.tabooCards.forEach(card => {
        if (card.target_img) {
          const paths = [
            `images/cards/local/${card.id}_target_${path.basename(card.target_img)}`,
            card.target_img
          ];
          const exists = paths.some(p => fs.existsSync(path.resolve(__dirname, '../../', p)));
          if (!exists) {
            imageErrors.push(`Card ${card.id}: Missing target image. Tried: ${paths.join(', ')}`);
          }
        }
      });
      expect(imageErrors).toEqual([]);
    });

    test('All probe images exist', () => {
      const imageErrors = [];
      window.tabooCards.forEach(card => {
        if (card.probe_img) {
          const paths = [
            `images/cards/local/${card.id}_probe_${path.basename(card.probe_img)}`,
            card.probe_img
          ];
          const exists = paths.some(p => fs.existsSync(path.resolve(__dirname, '../../', p)));
          if (!exists) {
            imageErrors.push(`Card ${card.id}: Missing probe image. Tried: ${paths.join(', ')}`);
          }
        }
      });
      expect(imageErrors).toEqual([]);
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

  describe('Audio Tests', () => {
    const requiredSounds = [
      'sounds/flip.mp3',
      'sounds/correct.mp3',
      'sounds/wrong.mp3',
      'sounds/beep-short.mp3',
      'sounds/beep-long.mp3'
    ];

    test('All sound files exist', () => {
      const missingFiles = requiredSounds.filter(sound =>
        !fs.existsSync(path.resolve(__dirname, '../../', sound))
      );
      expect(missingFiles).toEqual([]);
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