
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Card Navigation Tests', () => {
  let dom, document, nextBtn, prevBtn, targetWord;
  let currentCardIndex = 0;

  beforeEach(() => {
    // Set up DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <div id="card-container">
        <button id="prev-card">Previous</button>
        <button id="next-card">Next</button>
        <div id="taboo-card">
          <div id="target-word"></div>
          <div id="card-images">
            <div class="image-container">
              <img id="card-target-img" />
              <img id="card-probe-img" />
            </div>
          </div>
        </div>
      </div>
    `);

    // Setup globals
    global.window = dom.window;
    global.document = window.document;
    
    // Get elements
    nextBtn = document.getElementById('next-card');
    prevBtn = document.getElementById('prev-card');
    targetWord = document.getElementById('target-word');

    // Mock card data
    window.tabooCards = [
      {
        id: 1,
        targetWord: "Card 1",
        target_img: "images/cards/local/1_target.png",
        probe_img: "images/cards/local/1_probe.jpg"
      },
      {
        id: 2,
        targetWord: "Card 2",
        target_img: "images/cards/local/2_target.png",
        probe_img: "images/cards/local/2_probe.jpg"
      }
    ];

    // Mock functions
    window.playSound = jest.fn();
    window.ImageProxy = {
      loadImage: jest.fn()
    };
  });

  test('Next button advances to next card', () => {
    console.log('Testing next button navigation');
    
    // Initial state
    expect(currentCardIndex).toBe(0);
    
    // Simulate click
    const clickEvent = new window.Event('click');
    nextBtn.dispatchEvent(clickEvent);
    
    // Verify navigation
    expect(currentCardIndex).toBe(1);
    expect(window.playSound).toHaveBeenCalledWith('flip');
  });

  test('Previous button moves to previous card', () => {
    console.log('Testing previous button navigation');
    
    // Start from second card
    currentCardIndex = 1;
    
    // Simulate click
    const clickEvent = new window.Event('click');
    prevBtn.dispatchEvent(clickEvent);
    
    // Verify navigation
    expect(currentCardIndex).toBe(0);
    expect(window.playSound).toHaveBeenCalledWith('flip');
  });

  test('Navigation wraps around at boundaries', () => {
    console.log('Testing boundary navigation');
    
    // Test forward wrap
    currentCardIndex = window.tabooCards.length - 1;
    nextBtn.dispatchEvent(new window.Event('click'));
    expect(currentCardIndex).toBe(0);
    
    // Test backward wrap
    currentCardIndex = 0;
    prevBtn.dispatchEvent(new window.Event('click'));
    expect(currentCardIndex).toBe(window.tabooCards.length - 1);
  });

  test('Card content updates correctly', () => {
    console.log('Testing card content updates');
    
    // Initial card
    expect(targetWord.textContent).toBe(window.tabooCards[0].targetWord);
    
    // Next card
    nextBtn.dispatchEvent(new window.Event('click'));
    expect(targetWord.textContent).toBe(window.tabooCards[1].targetWord);
    
    // Previous card
    prevBtn.dispatchEvent(new window.Event('click'));
    expect(targetWord.textContent).toBe(window.tabooCards[0].targetWord);
  });
});
