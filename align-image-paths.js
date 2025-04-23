const fs = require('fs');
const path = require('path');

// Read card data file
const cardDataPath = './js/card-data.js';
let cardDataContent = fs.readFileSync(cardDataPath, 'utf8');

// Get list of standardized image files
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

console.log(`Found ${Object.keys(imageFiles).length} standardized image files`);

// Function to update image paths for a specific card ID
function updateCardImagePaths(content, cardId, filename) {
  const imageBasePath = 'images/cards/local/';
  const fullImagePath = imageBasePath + filename;
  
  // Update target_img and local_target_img
  content = content.replace(
    new RegExp(`(id:\\s*${cardId}[\\s\\S]*?target_img:\\s*")[^"]*(")`),
    `$1${fullImagePath}$2`
  );
  
  content = content.replace(
    new RegExp(`(id:\\s*${cardId}[\\s\\S]*?local_target_img:\\s*")[^"]*(")`),
    `$1${fullImagePath}$2`
  );
  
  return content;
}

// Process each card
let updatedCount = 0;

for (const [cardId, filename] of Object.entries(imageFiles)) {
  const oldContent = cardDataContent;
  cardDataContent = updateCardImagePaths(cardDataContent, cardId, filename);
  
  if (oldContent !== cardDataContent) {
    updatedCount++;
  }
}

// Write updated content back to file
fs.writeFileSync(cardDataPath, cardDataContent, 'utf8');

console.log(`\nImage path alignment complete! Updated ${updatedCount} card entries.`);

// Verify a few cards to ensure proper updating
console.log('\nVerifying a sample of card entries:');
const verifyIds = [1, 10, 20, 30];

for (const id of verifyIds) {
  if (!imageFiles[id]) continue;
  
  const cardMatch = cardDataContent.match(
    new RegExp(`id:\\s*${id},[\\s\\S]*?target_img:\\s*"([^"]*)"[\\s\\S]*?local_target_img:\\s*"([^"]*)"`)
  );
  
  if (cardMatch) {
    console.log(`Card ${id}:`);
    console.log(`  target_img: ${cardMatch[1]}`);
    console.log(`  local_target_img: ${cardMatch[2]}`);
  } else {
    console.log(`Card ${id}: Not found or pattern not matched`);
  }
} 