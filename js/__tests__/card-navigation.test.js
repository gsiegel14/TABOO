const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Card Navigation', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="card-container"></div>
      <button id="prev-card">Previous</button>
      <button id="next-card">Next</button>
      <div id="target-word"></div>
      <img id="card-target-img" />
      <img id="card-probe-img" />
    `;

    // Mock card data
    window.tabooCards = [
      {
        id: 1,
        target_img: 'images/cards/local/1_target_MorisonNoText.png',
        probe_img: 'images/cards/local/1_probe_fast_ruq_probe.jpg',
        prompt: 'Test Card 1'
      },
      {
        id: 2,
        target_img: 'images/cards/local/2_target.png',
        probe_img: 'images/cards/local/2_probe.jpg',
        prompt: 'Test Card 2'
      }
    ];

    // Load taboo.js
    require('../taboo.js');
  });

  test('Next button advances to next card', () => {
    const nextBtn = document.getElementById('next-card');
    const currentIndex = window.currentCardIndex || 0;

    nextBtn.click();

    expect(window.currentCardIndex).toBe((currentIndex + 1) % window.tabooCards.length);
  });

  test('Previous button goes to previous card', () => {
    const prevBtn = document.getElementById('prev-card');
    const currentIndex = window.currentCardIndex || 0;

    prevBtn.click();

    expect(window.currentCardIndex).toBe(
      currentIndex === 0 ? window.tabooCards.length - 1 : currentIndex - 1
    );
  });

  test('Card display updates after navigation', () => {
    const nextBtn = document.getElementById('next-card');
    nextBtn.click();

    const targetWord = document.getElementById('target-word');
    const targetImg = document.getElementById('card-target-img');
    const probeImg = document.getElementById('card-probe-img');

    expect(targetWord.textContent).toBe('Test Card 2');
    expect(targetImg.getAttribute('data-src')).toBe('images/cards/local/2_target.png');
    expect(probeImg.getAttribute('data-src')).toBe('images/cards/local/2_probe.jpg');
  });
});