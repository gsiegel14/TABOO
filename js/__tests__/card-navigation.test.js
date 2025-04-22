
const { JSDOM } = require('jsdom');

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
        targetWord: 'Test Card 1',
        target_img: 'images/cards/local/1_target.png',
        probe_img: 'images/cards/local/1_probe.jpg'
      },
      {
        id: 2,
        targetWord: 'Test Card 2',
        target_img: 'images/cards/local/2_target.png',
        probe_img: 'images/cards/local/2_probe.jpg'
      }
    ];

    window.currentCardIndex = 0;
    window.playSound = jest.fn();
    window.displayCard = jest.fn();

    // Mock card navigation functions
    window.nextCard = function() {
      window.currentCardIndex = (window.currentCardIndex + 1) % window.tabooCards.length;
      window.displayCard(window.currentCardIndex);
      window.playSound('flip');
    };

    window.prevCard = function() {
      window.currentCardIndex = window.currentCardIndex === 0 ? 
        window.tabooCards.length - 1 : window.currentCardIndex - 1;
      window.displayCard(window.currentCardIndex);
      window.playSound('flip');
    };

    // Add event listeners
    document.getElementById('next-card').addEventListener('click', window.nextCard);
    document.getElementById('prev-card').addEventListener('click', window.prevCard);
  });

  test('Next button advances to next card', () => {
    const nextBtn = document.getElementById('next-card');
    nextBtn.click();
    expect(window.currentCardIndex).toBe(1);
    expect(window.playSound).toHaveBeenCalledWith('flip');
  });

  test('Previous button goes to previous card', () => {
    const prevBtn = document.getElementById('prev-card');
    window.currentCardIndex = 1;
    prevBtn.click();
    expect(window.currentCardIndex).toBe(0);
    expect(window.playSound).toHaveBeenCalledWith('flip');
  });

  test('Navigation wraps around at boundaries', () => {
    const nextBtn = document.getElementById('next-card');
    const prevBtn = document.getElementById('prev-card');
    
    // Test forward wrap
    window.currentCardIndex = window.tabooCards.length - 1;
    nextBtn.click();
    expect(window.currentCardIndex).toBe(0);
    
    // Test backward wrap
    window.currentCardIndex = 0;
    prevBtn.click();
    expect(window.currentCardIndex).toBe(window.tabooCards.length - 1);
  });
});
