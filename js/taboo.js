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
        tick: new Audio('sounds/beep-short.mp3'),
        timeup: new Audio('sounds/beep-long.mp3'),
        correct: new Audio('sounds/correct.mp3'),
        wrong: new Audio('sounds/wrong.mp3'),
        flip: new Audio('sounds/flip.mp3')
    };

    // Initialize audio elements
    function initAudio() {
        audioEffects = {
            flip: new Audio('sounds/flip.mp3'),
            correct: new Audio('sounds/correct.mp3'),
            wrong: new Audio('sounds/wrong.mp3'),
            tick: new Audio('sounds/beep-short.mp3'),
            timeup: new Audio('sounds/beep-long.mp3')
        };

        // Set volume
        Object.values(audioEffects).forEach(audio => {
            audio.volume = 0.5;
            // Preload audio files
            audio.preload = 'auto';
        });

        // Add a flag to track if audio has been unlocked
        window.audioUnlocked = false;

        // Function to unlock audio on first user interaction
        function unlockAudio() {
            if (window.audioUnlocked) return;

            // Try to play each sound (browsers require user interaction)
            const unlock = Object.values(audioEffects).map(audio => {
                // Create a short silent sound
                audio.currentTime = 0;
                audio.muted = true;
                const playPromise = audio.play();

                if (playPromise !== undefined) {
                    return playPromise.then(() => {
                        audio.pause();
                        audio.muted = false;
                        return Promise.resolve();
                    }).catch(error => {
                        console.log('Audio play prevented: ' + error);
                        return Promise.resolve(); // Continue even if there's an error
                    });
                } else {
                    return Promise.resolve();
                }
            });

            // Mark audio as unlocked when all promises resolve
            Promise.all(unlock).then(() => {
                window.audioUnlocked = true;
                console.log('Audio unlocked successfully');
            });

            // Remove event listeners once unlocked
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        }

        // Add event listeners to unlock audio on user interaction
        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
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

        // Initialize Fancybox
        initFancybox();

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

    // Initialize Fancybox with custom options
    function initFancybox() {
        // Simple console check to verify Fancybox is available
        console.log('Fancybox available:', typeof Fancybox !== 'undefined');

        if (typeof Fancybox === 'undefined') {
            console.error('Fancybox not loaded! Images will not be expandable.');
            return;
        }

        // Set global defaults with explicit toolbar configuration
        Fancybox.defaults = {
            ...Fancybox.defaults,
            Image: { 
                zoom: true,
                wheel: true,
                click: true,
                doubleClick: true
            },
            Toolbar: {
                display: {
                    left: ["infobar"],
                    middle: [],
                    right: ["zoom", "slideshow", "fullscreen", "download", "thumbs", "close"]
                }
            },
            showClass: "fancybox-zoomIn",
            hideClass: "fancybox-zoomOut",
            dragToClose: false,
        };

        console.log('Fancybox initialized successfully with zoom enabled');
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
        // Ensure index is within bounds and update currentCardIndex
        if (index < 0) {
            index = tabooCards.length - 1;
        } else if (index >= tabooCards.length) {
            index = 0;
        }
        currentCardIndex = index;

        const card = tabooCards[currentCardIndex];

        // Add animation class
        tabooCardElement.classList.add('animating');

        // Play card flip sound
        playSound('flip');

        // Update card content
        targetWordElement.textContent = card.targetWord;

        // Check if title is long and add appropriate class
        if (card.targetWord && card.targetWord.length > 25) {
            targetWordElement.classList.add('long-title');
        } else {
            targetWordElement.classList.remove('long-title');
        }

        // Update the back title as well
        const backTargetWord = document.getElementById('back-target-word');
        if (backTargetWord) {
            backTargetWord.textContent = card.targetWord;

            // Apply same long-title class to back title
            if (card.targetWord && card.targetWord.length > 25) {
                backTargetWord.classList.add('long-title');
            } else {
                backTargetWord.classList.remove('long-title');
            }
        }

        // Update prompt text
        const promptEl = document.getElementById('card-prompt');
        promptEl.textContent = card.prompt || '';

        // Get the card-images container
        const cardImagesContainer = document.querySelector('.card-images');

        // Update target image
        const targetImgEl = document.getElementById('card-target-img');
        const targetContainer = targetImgEl.closest('.image-container');
        const targetWrapper = targetImgEl.closest('.image-wrapper');

        if (card.target_img) {
            // Use ImageProxy to load the image with fallbacks
            ImageProxy.loadImage(
                targetImgEl, 
                card.target_img,
                card.local_target_img || null,  // Use local fallback if available
                () => {
                    // Success callback
                    if (targetWrapper) targetWrapper.classList.add('loaded');
                    if (targetContainer) targetContainer.style.display = 'block';

                    // Setup Fancybox for this image
                    setupFancybox(targetImgEl, card.target_img, card.targetWord);

                    // If source_url exists, create and load a secondary image
                    if (card.source_url && card.source_url !== card.target_img && card.source_url !== card.local_target_img) {
                        ImageProxy.createSecondaryImage(targetImgEl, card.source_url);
                    }

                    // If remote_target_img exists, create and load a remote image
                    if (card.remote_target_img && 
                        card.remote_target_img !== card.target_img && 
                        card.remote_target_img !== card.local_target_img &&
                        card.remote_target_img !== card.source_url) {
                        ImageProxy.createRemoteImage(targetImgEl, card.remote_target_img);
                    }
                },
                () => {
                    // Error callback after all attempts
                    console.error('Failed to load target image after all attempts');
                    if (targetContainer) targetContainer.style.display = 'none';
                },
                card.source_url // Pass source_url to try as a fallback if primary and local fail
            );
        } else {
            // No image URL provided
            targetImgEl.src = 'images/cards/placeholder.svg';
            if (targetContainer) targetContainer.style.display = 'none';
        }

        // Update probe image
        const probeImgEl = document.getElementById('card-probe-img');
        const probeContainer = probeImgEl?.closest('.image-container');
        const probeWrapper = probeImgEl?.closest('.image-wrapper');

        if (probeImgEl && card.probe_img) {
            // Use ImageProxy to load the image with fallbacks
            ImageProxy.loadImage(
                probeImgEl, 
                card.probe_img,
                card.local_probe_img || null,  // Use local fallback if available
                () => {
                    // Success callback
                    if (probeWrapper) probeWrapper.classList.add('loaded');
                    if (probeContainer) probeContainer.style.display = 'block';

                    // Setup Fancybox for this image
                    setupFancybox(probeImgEl, card.probe_img, "Probe Position");
                },
                () => {
                    // Error callback after all attempts
                    console.error('Failed to load probe image after all attempts');
                    if (probeContainer) probeContainer.style.display = 'none';
                }
            );
        } else if (probeImgEl) {
            // No image URL provided
            probeImgEl.src = 'images/cards/placeholder.svg';
            if (probeContainer) probeContainer.style.display = 'none';
        }

        // Show or hide the card-images container based on whether any images are displayed
        if ((card.target_img || card.probe_img) && cardImagesContainer) {
            cardImagesContainer.style.display = 'flex';
        } else if (cardImagesContainer) {
            cardImagesContainer.style.display = 'none';
        }

        // Clear and populate taboo words for front/back
        tabooWordsElement && (tabooWordsElement.innerHTML = '');

        // BACK list
        const backList = document.getElementById('back-taboo-words');
        if (backList) {
            backList.innerHTML = '';
            card.tabooWords.forEach(word => {
                const li = document.createElement('li');
                li.textContent = word;
                backList.appendChild(li);
            });
        }

        // Remove animation class after animation completes
        setTimeout(() => {
            tabooCardElement.classList.remove('animating');
            // Force a reflow so the browser paints the flipped side
            const back = document.querySelector('#back-taboo-words');
            if (back) back.offsetHeight;
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
        prevCardBtn.addEventListener('click', () => {
            displayCard(currentCardIndex - 1);
            playSound('flip');
        });
        nextCardBtn.addEventListener('click', () => {
            displayCard(currentCardIndex + 1);
            playSound('flip');
        });

        // Keyboard controls
        document.addEventListener('keydown', handleKeyPress);

        // Toggle flip on card click
        tabooCardElement.addEventListener('click', () => {
            tabooCardElement.classList.toggle('flipped');
        });
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
            case 'd':
                // 'd' key toggles debug panel
                if (event.ctrlKey || event.metaKey) {
                    toggleDebugPanel();
                    event.preventDefault();
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

    // Play a sound effect
    function playSound(type) {
        if (!audioEffects || !audioEffects[type]) return;

        try {
            if (audioEffects[type].readyState >= 2) { // HAVE_CURRENT_DATA or higher
                audioEffects[type].currentTime = 0;
                const playPromise = audioEffects[type].play();

                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log('Sound play prevented: ' + error);
                    });
                }
            }
        } catch (e) {
            console.log('Sound play error: ' + e.message);
        }
    }

    // Debug functions
    function toggleDebugPanel() {
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            debugPanel.classList.toggle('hidden');

            // Set up debug listeners if now visible
            if (!debugPanel.classList.contains('hidden')) {
                setupDebugListeners();
                logDebugMessage('Debug mode activated', 'info');
            }
        }
    }

    function setupDebugListeners() {
        const toggleBtn = document.getElementById('toggle-debug');
        const testBtn = document.getElementById('test-images');
        const clearBtn = document.getElementById('clear-logs');
        const debugContent = document.querySelector('.debug-content');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                debugContent.classList.toggle('hidden');
                toggleBtn.textContent = debugContent.classList.contains('hidden') ? 
                    'Show Debug Info' : 'Hide Debug Info';
            });
        }

        if (testBtn) {
            testBtn.addEventListener('click', testImageLoading);
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const debugLog = document.getElementById('debug-log');
                if (debugLog) debugLog.textContent = '';

                const imageStatus = document.getElementById('image-status');
                if (imageStatus) imageStatus.innerHTML = '';

                logDebugMessage('Logs cleared', 'info');
            });
        }

        // Override console.log to capture to debug panel
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;

        console.log = function(...args) {
            originalConsoleLog.apply(console, args);
            logDebugMessage(args.join(' '), 'info');
        };

        console.error = function(...args) {
            originalConsoleError.apply(console, args);
            logDebugMessage(args.join(' '), 'error');
        };

        console.warn = function(...args) {
            originalConsoleWarn.apply(console, args);
            logDebugMessage(args.join(' '), 'warning');
        };
    }

    function logDebugMessage(message, type = 'info') {
        const debugLog = document.getElementById('debug-log');
        if (!debugLog) return;

        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const logEntry = document.createElement('div');
        logEntry.className = `debug-${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;

        debugLog.appendChild(logEntry);
        debugLog.scrollTop = debugLog.scrollHeight;
    }

    function testImageLoading() {
        const imageStatus = document.getElementById('image-status');
        if (!imageStatus) return;

        imageStatus.innerHTML = '<div>Testing image loading, please wait...</div>';

        // Try loading a sample of different domain images
        const testImages = [
            { 
                domain: 'ACEP', 
                url: 'https://www.acep.org/globalassets/new-pdfs/education/ultrasound/fast/fast_ruq_positive.jpg' 
            },
            { 
                domain: 'NYSORA', 
                url: 'https://www.nysora.com/wp-content/uploads/2023/01/femoral-nerve-us.jpg' 
            },
            { 
                domain: 'Radiopaedia', 
                url: 'https://radiopaedia.org/images/16564061' 
            },
            { 
                domain: 'Local', 
                url: 'images/cards/placeholder.svg' 
            }
        ];

        imageStatus.innerHTML = '';

        testImages.forEach(test => {
            const container = document.createElement('div');
            container.className = 'test-image-container';

            // Create status element
            const status = document.createElement('div');
            status.textContent = `Testing ${test.domain}: Loading...`;
            container.appendChild(status);

            // Create test image element
            const img = document.createElement('img');
            img.alt = `Test ${test.domain}`;
            img.style.display = 'none';
            container.appendChild(img);

            imageStatus.appendChild(container);

            // Test loading
            img.onload = () => {
                status.textContent = `✅ ${test.domain}: Success`;
                status.className = 'debug-success';
            };

            img.onerror = () => {
                status.textContent = `❌ ${test.domain}: Failed`;
                status.className = 'debug-error';
            };

            // Start loading
            logDebugMessage(`Testing image from ${test.domain}: ${test.url}`, 'info');
            img.src = test.url;
        });
    }

    // Helper function to set up Fancybox for an image
    function setupFancybox(imgElement, imgSrc, caption) {
        // Make the image use Fancybox
        imgElement.setAttribute('data-fancybox', 'gallery');
        imgElement.setAttribute('data-src', imgSrc);
        imgElement.style.cursor = 'zoom-in';

        // Add click handler to prevent card flip when clicking image
        const wrapper = imgElement.closest('.image-wrapper');
        if (wrapper) {
            wrapper.style.cursor = 'zoom-in';

            // Add event listener to stop propagation
            wrapper.onclick = function(e) {
                e.stopPropagation();
                console.log('Image clicked, stopping propagation');

                // Manually trigger Fancybox for more reliable operation
                if (typeof Fancybox !== 'undefined') {
                    Fancybox.show([{ 
                        src: imgElement.src, 
                        caption: caption || '' 
                    }], {
                        // Ensure zoom is enabled for this specific instance
                        Image: { 
                            zoom: true,
                            wheel: true,
                            click: true,
                            doubleClick: true
                        },
                        Toolbar: {
                            display: {
                                left: ["infobar"],
                                middle: [],
                                right: ["zoom", "slideshow", "fullscreen", "download", "thumbs", "close"]
                            }
                        }
                    });
                    console.log('Fancybox manually triggered with zoom enabled');
                }
            };
        }
    }

    // Initialize the game when DOM is loaded
    initGame();
});