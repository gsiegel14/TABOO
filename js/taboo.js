/**
 * Taboo Game Logic
 */

document.addEventListener('DOMContentLoaded', function() {
    // Game elements
    const timerElement = document.getElementById('timer');
    const startTimerBtn = document.getElementById('start-timer');
    const pauseTimerBtn = document.getElementById('pause-timer');
    const resetTimerBtn = document.getElementById('reset-timer');
    
    const team1ScoreElement = document.getElementById('team1-score');
    const team2ScoreElement = document.getElementById('team2-score');
    const team1PlusBtn = document.getElementById('team1-plus');
    const team1MinusBtn = document.getElementById('team1-minus');
    const team2PlusBtn = document.getElementById('team2-plus');
    const team2MinusBtn = document.getElementById('team2-minus');
    
    const tabooCardElement = document.getElementById('taboo-card');
    const targetWordElement = document.getElementById('target-word');
    const tabooWordsElement = document.getElementById('taboo-words');
    const prevCardBtn = document.getElementById('prev-card');
    const nextCardBtn = document.getElementById('next-card');
    
    // Sound effects
    const soundEffects = {
        tick: new Audio('../html5up-phantom/assets/js/beep-short.mp3'),
        timeup: new Audio('../html5up-phantom/assets/js/beep-long.mp3'),
        correct: new Audio('../html5up-phantom/assets/js/correct.mp3'),
        wrong: new Audio('../html5up-phantom/assets/js/wrong.mp3'),
        flip: new Audio('../html5up-phantom/assets/js/flip.mp3')
    };
    
    // Initialize audio (helps with mobile devices)
    function initAudio() {
        // Set volume
        Object.values(soundEffects).forEach(audio => {
            audio.volume = 0.5;
        });
        
        // Create a mute toggle if needed
        const muteToggle = document.createElement('button');
        muteToggle.id = 'mute-toggle';
        muteToggle.className = 'button small';
        muteToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        muteToggle.title = 'Toggle Sound';
        muteToggle.style.position = 'absolute';
        muteToggle.style.top = '10px';
        muteToggle.style.right = '10px';
        
        muteToggle.addEventListener('click', () => {
            const isMuted = !soundEffects.tick.muted;
            Object.values(soundEffects).forEach(audio => {
                audio.muted = isMuted;
            });
            muteToggle.innerHTML = isMuted ? 
                '<i class="fas fa-volume-mute"></i>' : 
                '<i class="fas fa-volume-up"></i>';
        });
        
        document.querySelector('.inner').appendChild(muteToggle);
    }
    
    // Game state
    let currentCardIndex = 0;
    let team1Score = 0;
    let team2Score = 0;
    let timerValue = 60;
    let timerInterval = null;
    let isTimerRunning = false;
    
    // Initialize game
    function initGame() {
        // Initialize audio
        initAudio();
        
        // Check if tabooCards is available
        if (typeof tabooCards === 'undefined') {
            console.error('Card data not loaded. Please check that card-data.js is loaded before taboo.js.');
            // Create placeholder cards if necessary
            window.tabooCards = [{
                id: 999,
                targetWord: "Error Loading Cards",
                tabooWords: ["Please refresh the page", "Check browser console", "Data loading issue"],
                category: "Error"
            }];
        }
        
        // Shuffle the cards
        shuffleCards();
        
        // Display the first card
        displayCard(currentCardIndex);
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Shuffle the cards
    function shuffleCards() {
        for (let i = tabooCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tabooCards[i], tabooCards[j]] = [tabooCards[j], tabooCards[i]];
        }
    }
    
    // Display a card
    function displayCard(index) {
        // Ensure index is within bounds
        if (index < 0) {
            currentCardIndex = tabooCards.length - 1;
        } else if (index >= tabooCards.length) {
            currentCardIndex = 0;
        } else {
            currentCardIndex = index;
        }
        
        const card = tabooCards[currentCardIndex];
        
        // Add animation class
        tabooCardElement.classList.add('animating');
        
        // Play card flip sound
        playSound('flip');
        
        // Update card content
        targetWordElement.textContent = card.targetWord;
        
        // Clear existing taboo words
        tabooWordsElement.innerHTML = '';
        
        // Add new taboo words
        card.tabooWords.forEach(word => {
            const li = document.createElement('li');
            li.textContent = word;
            tabooWordsElement.appendChild(li);
        });
        
        // Remove animation class after animation completes
        setTimeout(() => {
            tabooCardElement.classList.remove('animating');
        }, 300);
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Timer controls
        startTimerBtn.addEventListener('click', startTimer);
        pauseTimerBtn.addEventListener('click', pauseTimer);
        resetTimerBtn.addEventListener('click', resetTimer);
        
        // Score controls
        team1PlusBtn.addEventListener('click', () => {
            updateScore(1, 1);
            playSound('correct');
        });
        team1MinusBtn.addEventListener('click', () => {
            updateScore(1, -1);
            playSound('wrong');
        });
        team2PlusBtn.addEventListener('click', () => {
            updateScore(2, 1);
            playSound('correct');
        });
        team2MinusBtn.addEventListener('click', () => {
            updateScore(2, -1);
            playSound('wrong');
        });
        
        // Card navigation
        prevCardBtn.addEventListener('click', () => displayCard(currentCardIndex - 1));
        nextCardBtn.addEventListener('click', () => displayCard(currentCardIndex + 1));
        
        // Keyboard controls
        document.addEventListener('keydown', handleKeyPress);
    }
    
    // Handle keyboard presses
    function handleKeyPress(event) {
        switch (event.key) {
            case 'ArrowLeft':
                displayCard(currentCardIndex - 1);
                break;
            case 'ArrowRight':
                displayCard(currentCardIndex + 1);
                break;
            case ' ':
                // Space bar toggles timer
                if (isTimerRunning) {
                    pauseTimer();
                } else {
                    startTimer();
                }
                break;
        }
    }
    
    // Timer functions
    function startTimer() {
        if (!isTimerRunning) {
            isTimerRunning = true;
            timerInterval = setInterval(() => {
                timerValue--;
                timerElement.textContent = timerValue;
                
                // Play sound at 10 seconds and 5 seconds
                if (timerValue === 10 || timerValue === 5) {
                    playSound('tick');
                }
                
                // Time's up
                if (timerValue <= 0) {
                    pauseTimer();
                    timerElement.textContent = '0';
                    playSound('timeup');
                    
                    // Visual indication that time is up
                    timerElement.classList.add('time-up');
                    setTimeout(() => {
                        timerElement.classList.remove('time-up');
                    }, 1000);
                }
            }, 1000);
        }
    }
    
    function pauseTimer() {
        isTimerRunning = false;
        clearInterval(timerInterval);
    }
    
    function resetTimer() {
        pauseTimer();
        timerValue = 60;
        timerElement.textContent = timerValue;
    }
    
    // Update team score
    function updateScore(team, amount) {
        if (team === 1) {
            team1Score = Math.max(0, team1Score + amount);
            team1ScoreElement.textContent = team1Score;
            animateScore(team1ScoreElement);
        } else {
            team2Score = Math.max(0, team2Score + amount);
            team2ScoreElement.textContent = team2Score;
            animateScore(team2ScoreElement);
        }
    }
    
    // Animate score change
    function animateScore(element) {
        element.classList.add('score-changed');
        setTimeout(() => {
            element.classList.remove('score-changed');
        }, 300);
    }
    
    // Play sound effect
    function playSound(type) {
        if (soundEffects[type]) {
            // Clone the audio to allow overlapping sounds
            const sound = soundEffects[type].cloneNode();
            sound.play().catch(e => {
                // Handle autoplay restrictions (common in browsers)
                console.log('Audio playback was prevented: ', e);
            });
        }
    }
    
    // Initialize the game when the page loads
    initGame();
}); 