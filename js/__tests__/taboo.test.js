
/**
 * Taboo Game UI and Image Loading Tests
 */

const fs = require('fs');
const path = require('path');

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
    test('All cards have valid image paths', () => {
      const imageErrors = [];
      
      window.tabooCards.forEach(card => {
        if (card.target_img) {
          const imgPath = path.resolve(__dirname, '../../', card.target_img);
          const exists = fs.existsSync(imgPath);
          if (!exists) {
            imageErrors.push(`Card ${card.id}: Missing target image at ${card.target_img}`);
          }
        }
        
        if (card.probe_img) {
          const imgPath = path.resolve(__dirname, '../../', card.probe_img);
          const exists = fs.existsSync(imgPath);
          if (!exists) {
            imageErrors.push(`Card ${card.id}: Missing probe image at ${card.probe_img}`);
          }
        }
      });

      expect(imageErrors).toHaveLength(0, imageErrors.join('\n'));
    });

    test('All cards have required properties', () => {
      const cardErrors = [];
      
      window.tabooCards.forEach(card => {
        if (!card.id) cardErrors.push(`Card missing ID: ${JSON.stringify(card)}`);
        if (!card.targetWord) cardErrors.push(`Card ${card.id}: Missing targetWord`);
        if (!card.tabooWords || !Array.isArray(card.tabooWords)) {
          cardErrors.push(`Card ${card.id}: Invalid or missing tabooWords`);
        }
      });

      expect(cardErrors).toHaveLength(0, cardErrors.join('\n'));
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
});
