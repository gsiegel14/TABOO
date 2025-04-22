
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

describe('Card Navigation Tests', () => {
  let window, document, nextBtn, prevBtn;
  let currentCardIndex = 0;

  beforeEach(() => {
    // Set up DOM environment
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <div id="card-container">
        <button id="prev-card">Previous</button>
        <button id="next-card">Next</button>
        <div id="taboo-card">
          <div id="target-word"></div>
          <img id="card-target-img" />
          <img id="card-probe-img" />
        </div>
      </div>
    `);

    // Setup globals
    window = dom.window;
    document = window.document;
    
    // Get button elements
    nextBtn = document.getElementById('next-card');
    prevBtn = document.getElementById('prev-card');

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
      loadImage: jest.fn((img, src, fallback, onSuccess, onError) => {
        console.log('Loading image:', src);
        onSuccess();
      })
    };
  });

  test('Next button advances to next card', () => {
    console.log('Starting next button test');
    
    // Initial state
    expect(currentCardIndex).toBe(0);
    
    // Simulate click
    const clickEvent = new window.Event('click');
    nextBtn.dispatchEvent(clickEvent);
    
    // Log state after click
    console.log('Current index after next:', currentCardIndex);
    console.log('Expected card:', window.tabooCards[1].targetWord);
    
    // Verify navigation
    expect(currentCardIndex).toBe(1);
    expect(document.getElementById('target-word').textContent)
      .toBe(window.tabooCards[1].targetWord);
  });

  test('Previous button moves to previous card', () => {
    console.log('Starting previous button test');
    
    // Start from second card
    currentCardIndex = 1;
    
    // Simulate click
    const clickEvent = new window.Event('click');
    prevBtn.dispatchEvent(clickEvent);
    
    // Log state after click
    console.log('Current index after prev:', currentCardIndex);
    console.log('Expected card:', window.tabooCards[0].targetWord);
    
    // Verify navigation
    expect(currentCardIndex).toBe(0);
    expect(document.getElementById('target-word').textContent)
      .toBe(window.tabooCards[0].targetWord);
  });

  test('Navigation wraps around at boundaries', () => {
    console.log('Testing boundary navigation');
    
    // Test going forward from last card
    currentCardIndex = window.tabooCards.length - 1;
    nextBtn.dispatchEvent(new window.Event('click'));
    expect(currentCardIndex).toBe(0);
    
    // Test going backward from first card
    currentCardIndex = 0;
    prevBtn.dispatchEvent(new window.Event('click'));
    expect(currentCardIndex).toBe(window.tabooCards.length - 1);
  });
});
