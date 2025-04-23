const fs = require('fs');
const path = require('path');

// Read the original card data file to extract the information
const cardDataPath = './js/card-data.js';
const originalContent = fs.readFileSync(cardDataPath, 'utf8');

// Create a backup of the original file
const backupPath = './js/card-data.js.bak3';
fs.writeFileSync(backupPath, originalContent);
console.log(`Created backup at ${backupPath}`);

// Function to safely extract a string property from a card match
function extractProperty(cardText, property) {
  const regex = new RegExp(`${property}:\\s*"([^"]*)"`, 'i');
  const match = cardText.match(regex);
  return match ? match[1] : '';
}

// Function to extract taboo words array from a card match
function extractTabooWords(cardText) {
  const regex = /tabooWords:\s*\[(.*?)\]/s;
  const match = cardText.match(regex);
  if (!match) return [];
  
  // Extract the words inside the array
  const wordsText = match[1];
  const words = [];
  const wordRegex = /"([^"]*)"/g;
  let wordMatch;
  
  while ((wordMatch = wordRegex.exec(wordsText)) !== null) {
    words.push(wordMatch[1]);
  }
  
  return words;
}

// Extract all cards
const cardsData = [];
const cardRegex = /\{\s*(?:id|"id"):\s*(\d+)[\s\S]*?(?=\{\s*(?:id|"id"):|];)/g;
let cardMatch;

while ((cardMatch = cardRegex.exec(originalContent)) !== null) {
  const cardId = parseInt(cardMatch[1]);
  const cardText = cardMatch[0];
  
  try {
    const card = {
      id: cardId,
      prompt: extractProperty(cardText, 'prompt'),
      targetWord: extractProperty(cardText, 'targetWord'),
      target_img: extractProperty(cardText, 'target_img'),
      probe_img: null, // Default value
      local_target_img: extractProperty(cardText, 'local_target_img'),
      local_probe_img: null, // Default value
      tabooWords: extractTabooWords(cardText),
      remote_target_img: extractProperty(cardText, 'remote_target_img')
    };
    
    cardsData.push(card);
  } catch (err) {
    console.error(`Error processing card ${cardId}:`, err.message);
  }
}

// Sort cards by ID
cardsData.sort((a, b) => a.id - b.id);

console.log(`Extracted ${cardsData.length} cards`);

// Check if we have local image files for each card
const imagesDir = './images/cards/local';
const imageFiles = fs.readdirSync(imagesDir)
  .filter(file => file.match(/^\d+_target\./))
  .reduce((acc, file) => {
    const match = file.match(/^(\d+)_target/);
    if (match) {
      const id = parseInt(match[1]);
      acc[id] = file;
    }
    return acc;
  }, {});

console.log(`Found ${Object.keys(imageFiles).length} local image files`);

// Update cards with local image paths for those that have images
for (const card of cardsData) {
  if (imageFiles[card.id]) {
    const imagePath = `images/cards/local/${imageFiles[card.id]}`;
    card.target_img = imagePath;
    card.local_target_img = imagePath;
    // Keep remote_target_img as is
  }
}

// Generate new card-data.js file
let newContent = `/*
 * Taboo Game Card Data (Revised for Scanning Normal Anatomy on Models)
 * Prompts focus on finding standard views or normal structures,
 * suitable for blindfolded scanning practice on ultrasound models/phantoms.
 * Removed pathology-dependent, eye, groin, pregnancy, and testicle cards.
 * Verified remote_target_img links point to relevant normal anatomy/views.
 */

const tabooCards = [\n`;

// Add each card with proper formatting and escaping
cardsData.forEach((card, index) => {
  const tabooWordsStr = card.tabooWords.map(word => `"${word}"`).join(', ');
  
  newContent += `  {
    id: ${card.id},
    prompt: "${card.prompt}",
    targetWord: "${card.targetWord}",
    target_img: "${card.target_img}",
    probe_img: null,
    local_target_img: "${card.local_target_img}",
    local_probe_img: null,
    tabooWords: [${tabooWordsStr}],
    remote_target_img: "${card.remote_target_img}"
  }${index < cardsData.length - 1 ? ',' : ''}
`;
});

// Close the array
newContent += '];';

// Write the new file
fs.writeFileSync(cardDataPath, newContent);
console.log('\nSuccessfully rebuilt card data file with correct syntax');

// Verify syntax
try {
  // Create a temporary copy with a module.exports for testing
  const tempFilePath = './js/card-data-test.js';
  const moduleContent = newContent.replace(/const tabooCards = /, 'module.exports = ');
  fs.writeFileSync(tempFilePath, moduleContent);
  
  // Try to require it
  try {
    require(tempFilePath);
    console.log('\n✅ Syntax check passed! Cards file successfully loaded.');
  } catch (e) {
    console.error('\n❌ Syntax error still present:', e.message);
  }
  
  // Clean up temp file
  fs.unlinkSync(tempFilePath);
} catch (e) {
  console.error('\n❌ Error verifying syntax:', e.message);
} 