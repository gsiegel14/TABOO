/**
 * Verify Card Data Script
 * 
 * This script loads the card-data.js file and verifies that:
 * 1. The syntax is valid JavaScript
 * 2. The tabooCards array is defined
 * 3. All required fields in each card have valid values
 */

// Create a temporary module to load the card data
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Path to the card data file
const cardDataPath = './js/card-data.js';

console.log('🔍 Verifying card data in:', cardDataPath);

// Check if file exists
if (!fs.existsSync(cardDataPath)) {
  console.error('❌ Card data file not found!');
  process.exit(1);
}

// Read the file
const cardDataContent = fs.readFileSync(cardDataPath, 'utf8');

// Create a sandbox environment with explicit global variables
const sandbox = {
  console: console,
  tabooCards: null
};

// Create a new context
const context = vm.createContext(sandbox);

try {
  // Execute the card data script in the sandbox context
  vm.runInContext(cardDataContent, context);
  
  // Show properties in the sandbox
  console.log('Available properties in the sandbox:', Object.keys(sandbox));
  
  // Check if tabooCards is defined
  if (!sandbox.tabooCards || !Array.isArray(sandbox.tabooCards)) {
    console.error('❌ The tabooCards array is not properly defined!');
    
    // Try to find any array in the sandbox
    const arrays = Object.keys(sandbox).filter(key => 
      Array.isArray(sandbox[key]) && sandbox[key].length > 0);
    
    if (arrays.length > 0) {
      console.log('📌 Found arrays in the sandbox: ', arrays);
      console.log('📌 First array has', sandbox[arrays[0]].length, 'items');
      
      // Set tabooCards to the first found array for testing
      sandbox.tabooCards = sandbox[arrays[0]];
      console.log('📌 Using', arrays[0], 'as a fallback');
    } else {
      console.error('❌ No arrays found in the sandbox');
      process.exit(1);
    }
  }
  
  const cards = sandbox.tabooCards;
  console.log(`✅ Successfully loaded ${cards.length} cards`);
  
  // Verify required fields on each card
  const requiredFields = ['id', 'targetWord', 'target_img', 'local_target_img', 'tabooWords'];
  
  let validCards = 0;
  let invalidCards = 0;
  let warnings = 0;
  
  cards.forEach((card, index) => {
    const cardId = card.id || index;
    let isCardValid = true;
    
    // Check required fields
    requiredFields.forEach(field => {
      if (field === 'tabooWords') {
        if (!card[field] || !Array.isArray(card[field]) || card[field].length === 0) {
          console.error(`❌ Card #${cardId}: Missing or invalid '${field}'`);
          isCardValid = false;
        }
      } else if (!card[field]) {
        console.error(`❌ Card #${cardId}: Missing required field '${field}'`);
        isCardValid = false;
      }
    });
    
    // Check image paths
    if (card.target_img && !card.target_img.includes('images/cards/local/')) {
      console.warn(`⚠️ Card #${cardId}: target_img does not point to a local image:`, card.target_img);
      warnings++;
    }
    
    if (isCardValid) {
      validCards++;
    } else {
      invalidCards++;
    }
  });
  
  console.log('\n📊 Validation Summary:');
  console.log(`- Total cards: ${cards.length}`);
  console.log(`- Valid cards: ${validCards}`);
  console.log(`- Cards with issues: ${invalidCards}`);
  console.log(`- Warnings: ${warnings}`);
  
  if (invalidCards === 0) {
    console.log('\n✅ All cards have valid data! The game should work properly.');
  } else {
    console.log('\n⚠️ Some cards have issues that need to be fixed.');
  }
  
} catch (error) {
  console.error('❌ Error parsing card data file:', error.message);
  console.error('Line:', error.lineNumber);
  
  // Try to find the line with the error
  if (error.stack) {
    const match = error.stack.match(/at (?:evalmachine\.<anonymous>|<anonymous>):(\d+)/);
    if (match) {
      const lineNumber = parseInt(match[1], 10);
      console.error(`Error on line ${lineNumber}`);
      
      // Display the problematic lines
      const lines = cardDataContent.split('\n');
      const start = Math.max(0, lineNumber - 5);
      const end = Math.min(lines.length, lineNumber + 5);
      
      console.log('\nContext:');
      for (let i = start; i < end; i++) {
        const lineIndicator = i + 1 === lineNumber ? '>> ' : '   ';
        console.log(`${lineIndicator}${i + 1}: ${lines[i]}`);
      }
    }
  }
  
  process.exit(1);
} 