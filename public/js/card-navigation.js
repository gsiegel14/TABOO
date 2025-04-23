/**
 * Card Navigation Script
 * Handles next/previous buttons and keyboard navigation for the Taboo game
 */

(function() {
    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Card navigation elements
        const prevCardBtn = document.getElementById('prev-card');
        const nextCardBtn = document.getElementById('next-card');
        
        // Make sure the elements exist
        if (!prevCardBtn || !nextCardBtn) {
            console.error('Navigation buttons not found.');
            return;
        }
        
        // Wait for tabooCards to be initialized from card-data.js
        // and for displayCard function to be available from taboo.js
        const checkDependencies = function() {
            if (typeof window.tabooCards === 'undefined' || 
                typeof window.currentCardIndex === 'undefined' ||
                typeof window.displayCard === 'undefined') {
                
                console.log('Waiting for dependencies to load...');
                setTimeout(checkDependencies, 100);
                return;
            }
            
            // Initialize navigation
            initCardNavigation();
        };
        
        // Initialize card navigation once dependencies are loaded
        function initCardNavigation() {
            console.log('Card navigation initialized.');
            
            // Previous button handler
            function handlePrevCard(event) {
                if (event) event.preventDefault();
                console.log('Previous button clicked');
                
                if (!window.tabooCards || !window.tabooCards.length) {
                    console.error('No cards available for navigation');
                    return;
                }
                
                let newIndex = window.currentCardIndex - 1;
                if (newIndex < 0) {
                    newIndex = window.tabooCards.length - 1;
                }
                
                // Call the displayCard function from taboo.js
                window.displayCard(newIndex);
                
                // Play flip sound if available
                if (window.playSound) {
                    try {
                        window.playSound('flip');
                    } catch (e) {
                        console.log('Sound play error:', e);
                    }
                }
            }
            
            // Next button handler
            function handleNextCard(event) {
                if (event) event.preventDefault();
                console.log('Next button clicked');
                
                if (!window.tabooCards || !window.tabooCards.length) {
                    console.error('No cards available for navigation');
                    return;
                }
                
                let newIndex = window.currentCardIndex + 1;
                if (newIndex >= window.tabooCards.length) {
                    newIndex = 0;
                }
                
                // Call the displayCard function from taboo.js
                window.displayCard(newIndex);
                
                // Play flip sound if available
                if (window.playSound) {
                    try {
                        window.playSound('flip');
                    } catch (e) {
                        console.log('Sound play error:', e);
                    }
                }
            }
            
            // Clean up any existing event listeners
            if (prevCardBtn._clickHandler) {
                prevCardBtn.removeEventListener('click', prevCardBtn._clickHandler);
            }
            if (nextCardBtn._clickHandler) {
                nextCardBtn.removeEventListener('click', nextCardBtn._clickHandler);
            }
            
            // Attach event listeners
            prevCardBtn.addEventListener('click', handlePrevCard);
            prevCardBtn._clickHandler = handlePrevCard;
            
            nextCardBtn.addEventListener('click', handleNextCard);
            nextCardBtn._clickHandler = handleNextCard;
            
            // Add keyboard navigation
            document.removeEventListener('keydown', handleKeyPress);
            document.addEventListener('keydown', handleKeyPress);
            
            // Handle keyboard presses
            function handleKeyPress(event) {
                switch (event.key) {
                    case 'ArrowLeft':
                        handlePrevCard();
                        break;
                    case 'ArrowRight':
                        handleNextCard();
                        break;
                }
            }
        }
        
        // Start checking for dependencies
        checkDependencies();
    });
})(); 