/**
 * Replace Broken Images with Placeholders
 * 
 * This script:
 * 1. Identifies broken images with zero or small size
 * 2. Replaces them with a properly formatted placeholder
 * 3. Updates card-data.js to point to the correct images
 */

const fs = require('fs');
const path = require('path');

// Get the list of cards with corrupted images from verify-images.js output
const brokenCardIds = [2, 8, 10, 11, 14, 16, 19, 20, 21, 22, 23, 29, 31, 33, 34, 35]; 

// Path to placeholder image - make sure this exists
const placeholderPath = path.join(__dirname, '../images/cards/placeholder.svg');
if (!fs.existsSync(placeholderPath)) {
    console.error('Placeholder image not found at ' + placeholderPath);
    process.exit(1);
}

// Default fallback image directories
const defaultsDir = path.join(__dirname, '../images/cards/defaults');
if (!fs.existsSync(defaultsDir)) {
    fs.mkdirSync(defaultsDir, { recursive: true });
}

// Copy the placeholder to create default replacements
for (const cardId of brokenCardIds) {
    const defaultImagePath = path.join(defaultsDir, `ultrasound_${cardId}.png`);
    
    // Only copy if doesn't already exist
    if (!fs.existsSync(defaultImagePath)) {
        fs.copyFileSync(placeholderPath, defaultImagePath);
        console.log(`Created default image: ${defaultImagePath}`);
    }
}

// Import card data
const cardDataPath = path.join(__dirname, '../js/card-data.js');
const cardDataContent = fs.readFileSync(cardDataPath, 'utf8');
const tabooCardsMatch = cardDataContent.match(/const tabooCards = (\[[\s\S]*?\]);/);

if (!tabooCardsMatch) {
    console.error('Could not parse tabooCards from card-data.js');
    process.exit(1);
}

// Evaluate the array content
const tabooCards = eval(tabooCardsMatch[1]);
console.log(`Found ${tabooCards.length} cards in card-data.js`);

// Update each broken card to use the placeholder
let updatedCount = 0;
for (const cardId of brokenCardIds) {
    const card = tabooCards.find(c => c.id === cardId);
    if (!card) {
        console.error(`Card ID ${cardId} not found in card data`);
        continue;
    }
    
    // Set the path to the default placeholder
    const defaultImagePath = `images/cards/defaults/ultrasound_${cardId}.png`;
    
    // Update the card
    card.target_img = defaultImagePath;
    card.local_target_img = defaultImagePath;
    
    console.log(`Updated card ${cardId} to use default image: ${defaultImagePath}`);
    updatedCount++;
}

// Write updated card data
console.log(`\nUpdating ${updatedCount} cards in card-data.js...`);
let updatedCardData = cardDataContent.replace(
    /const tabooCards = \[[\s\S]*?\];/, 
    `const tabooCards = ${JSON.stringify(tabooCards, null, 4)};`
);

fs.writeFileSync(cardDataPath, updatedCardData, 'utf8');
console.log(`✅ Updated card data saved to ${cardDataPath}`);

// Generate report
console.log('\n--- SUMMARY ---');
console.log(`Total broken images fixed: ${updatedCount}`);
console.log(`Placeholder directory: ${defaultsDir}`);
console.log('\nNext steps:');
console.log('1. Manually download the specific ultrasound images for each card');
console.log('2. Save them to the "images/cards/defaults/" directory with naming format "ultrasound_CARDID.png"');
console.log('3. The cards will automatically use them next time the game is loaded');
console.log('\nExample URLs to try for each card:');
for (const cardId of brokenCardIds) {
    const card = tabooCards.find(c => c.id === cardId);
    if (card && card.remote_target_img) {
        console.log(`Card ${cardId}: ${card.remote_target_img}`);
    }
} 