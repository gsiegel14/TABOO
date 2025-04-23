const fs = require('fs');
const path = require('path');

// Define paths
const LOCAL_IMAGES_DIR = './images/cards/local';
const CARD_DATA_FILE = './js/card-data.js';
const BACKUP_FILE = './js/card-data.js.sync-backup';

console.log('🔄 Starting image path sync process');

// Create backup if it doesn't exist
if (!fs.existsSync(BACKUP_FILE)) {
  console.log(`📦 Creating backup of original card data at ${BACKUP_FILE}`);
  fs.copyFileSync(CARD_DATA_FILE, BACKUP_FILE);
}

// Read local image files
try {
  const localImages = fs.readdirSync(LOCAL_IMAGES_DIR);
  
  // Extract card IDs from filenames (e.g., 23_target.jpg, 4_target.png)
  const cardImageMap = {};
  
  localImages.forEach(filename => {
    const match = filename.match(/^(\d+)_target\.(jpg|jpeg|png|gif|webp)/i);
    if (match) {
      const cardId = parseInt(match[1], 10);
      cardImageMap[cardId] = path.join(LOCAL_IMAGES_DIR, filename).replace(/^\.\//, '');
    }
  });
  
  const cardIds = Object.keys(cardImageMap);
  console.log(`🖼️ Found ${cardIds.length} local images for cards`);
  
  // Read card data
  const cardDataContent = fs.readFileSync(CARD_DATA_FILE, 'utf8');
  let updatedContent = cardDataContent;
  let updateCount = 0;
  
  // Update image paths for each card
  cardIds.forEach(cardId => {
    const localPath = cardImageMap[cardId];
    
    // Pattern to find the card with this ID in the data file
    const cardPattern = new RegExp(`id:\\s*${cardId}[^}]*?(local_target_img:\\s*"[^"]*")[^}]*?}`, 's');
    const noLocalImagePattern = new RegExp(`id:\\s*${cardId}[^}]*?}`, 's');
    
    if (cardPattern.test(updatedContent)) {
      // Card has a local_target_img field, update it
      const oldMatch = updatedContent.match(cardPattern);
      if (oldMatch) {
        const oldLocalPath = oldMatch[1];
        const newLocalPath = `local_target_img: "${localPath}"`;
        
        if (oldLocalPath !== newLocalPath) {
          updatedContent = updatedContent.replace(oldLocalPath, newLocalPath);
          updateCount++;
          console.log(`✏️ Updated card ${cardId} with local image path: ${localPath}`);
        }
      }
    } else if (noLocalImagePattern.test(updatedContent)) {
      // Card exists but doesn't have a local_target_img field, add it
      const cardMatch = updatedContent.match(noLocalImagePattern);
      if (cardMatch) {
        const cardObject = cardMatch[0];
        const newCardObject = cardObject.replace('}', `,\n    local_target_img: "${localPath}"\n  }`);
        updatedContent = updatedContent.replace(cardObject, newCardObject);
        updateCount++;
        console.log(`➕ Added local image path to card ${cardId}: ${localPath}`);
      }
    } else {
      console.log(`⚠️ Could not find card with ID ${cardId} in the data file`);
    }
  });
  
  // Save updated content
  fs.writeFileSync(CARD_DATA_FILE, updatedContent);
  
  console.log(`✅ Sync complete! Updated ${updateCount} image paths`);
  console.log(`💾 Original data backed up at ${BACKUP_FILE}`);
  
} catch (error) {
  console.error('❌ Error during sync process:', error.message);
  process.exit(1);
} 