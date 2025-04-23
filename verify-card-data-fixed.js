const fs = require('fs');
const path = require('path');

// Define file paths
const FIXED_CARD_DATA_PATH = './js/card-data.fixed.js';
const TEMP_CARD_DATA_PATH = './temp-card-data.js';

console.log('🔍 Starting card data verification');

// Check if the fixed card data file exists
if (!fs.existsSync(FIXED_CARD_DATA_PATH)) {
  console.error(`❌ Error: Fixed card data file not found at ${FIXED_CARD_DATA_PATH}`);
  process.exit(1);
}

// Read the card data
try {
  console.log(`📖 Reading card data from ${FIXED_CARD_DATA_PATH}`);
  const cardDataContent = fs.readFileSync(FIXED_CARD_DATA_PATH, 'utf8');
  
  // Create a temporary file that exports the tabooCards array
  const tempFileContent = `${cardDataContent}\nmodule.exports = { tabooCards };`;
  fs.writeFileSync(TEMP_CARD_DATA_PATH, tempFileContent);
  
  // Require the temporary file to get the tabooCards array
  const { tabooCards } = require(path.resolve(TEMP_CARD_DATA_PATH));
  
  // Clean up the temporary file
  fs.unlinkSync(TEMP_CARD_DATA_PATH);
  
  // Verify that tabooCards is an array
  if (!Array.isArray(tabooCards)) {
    console.error('❌ Error: tabooCards is not an array');
    process.exit(1);
  }
  
  console.log(`✅ Found ${tabooCards.length} cards in the data file`);
  
  // Count cards with local and remote images
  let localImageCount = 0;
  let remoteImageCount = 0;
  let missingFieldsCount = 0;
  
  // Check for required fields in each card
  tabooCards.forEach((card, index) => {
    const requiredFields = ['id', 'prompt', 'targetWord', 'tabooWords'];
    const missingFields = requiredFields.filter(field => !card.hasOwnProperty(field));
    
    if (missingFields.length > 0) {
      console.error(`❌ Card at index ${index} is missing required fields: ${missingFields.join(', ')}`);
      missingFieldsCount++;
    }
    
    // Check image fields
    if (card.local_target_img) {
      localImageCount++;
    }
    
    if (card.remote_target_img) {
      remoteImageCount++;
    }
  });
  
  console.log(`✅ Cards with local images: ${localImageCount}`);
  console.log(`✅ Cards with remote images: ${remoteImageCount}`);
  
  if (missingFieldsCount > 0) {
    console.error(`❌ Found ${missingFieldsCount} cards with missing required fields`);
    process.exit(1);
  } else {
    console.log('✅ All cards have the required fields');
  }
  
  console.log('✅ Card data verification completed successfully');
  
} catch (error) {
  console.error('❌ Error during verification:', error.message);
  process.exit(1);
} 