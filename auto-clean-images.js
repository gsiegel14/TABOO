/**
 * Auto Clean Images
 * 
 * This script performs the following tasks:
 * 1. Removes hidden files (.DS_Store, etc.) from the images directory
 * 2. Verifies that only valid image files are in the directory
 * 3. Updates card data to use the local image paths
 */

const fs = require('fs');
const path = require('path');

// Paths
const localImagesDir = './images/cards/local';
const cardDataPath = './js/card-data.js';
const backupDataPath = './js/card-data.js.auto-clean-backup';

console.log('🧹 Starting image directory cleanup and verification');

// Backup card data file
if (!fs.existsSync(backupDataPath)) {
  fs.copyFileSync(cardDataPath, backupDataPath);
  console.log(`✅ Backed up card data to ${backupDataPath}`);
}

// Function to check if a file is a valid image file
function isValidImageFile(filename) {
  if (filename.startsWith('.')) return false; // Skip hidden files
  
  // Valid image extensions
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = path.extname(filename).toLowerCase();
  return validExtensions.includes(ext);
}

// STEP 1: Clean up hidden files
console.log('\n📁 Scanning for hidden files...');
const files = fs.readdirSync(localImagesDir);
const hiddenFiles = files.filter(file => file.startsWith('.'));

if (hiddenFiles.length === 0) {
  console.log('✅ No hidden files found.');
} else {
  console.log(`🚫 Found ${hiddenFiles.length} hidden files: ${hiddenFiles.join(', ')}`);
  
  // Delete each hidden file
  hiddenFiles.forEach(file => {
    const filePath = path.join(localImagesDir, file);
    try {
      fs.unlinkSync(filePath);
      console.log(`  🗑️  Deleted: ${file}`);
    } catch (error) {
      console.error(`  ❌ Error deleting ${file}: ${error.message}`);
    }
  });
}

// STEP 2: Verify only image files remain
console.log('\n🔍 Verifying only valid image files remain...');
const remainingFiles = fs.readdirSync(localImagesDir);
const nonImageFiles = remainingFiles.filter(file => !isValidImageFile(file));

if (nonImageFiles.length === 0) {
  console.log('✅ Only valid image files remain in the directory.');
} else {
  console.log(`⚠️  Warning: Found ${nonImageFiles.length} non-image files remaining: ${nonImageFiles.join(', ')}`);
  console.log('  These should be manually reviewed and removed if not needed.');
}

// STEP 3: Build map of card IDs to image files
console.log('\n🧩 Building map of card IDs to images...');
const validImageFiles = remainingFiles.filter(isValidImageFile);
console.log(`Found ${validImageFiles.length} valid image files`);

const imageMap = {};
validImageFiles.forEach(file => {
  // Match files like "23_target.jpg", "4_target.png", etc.
  const match = file.match(/^(\d+)_target\.(jpg|jpeg|png|gif|webp|svg)$/i);
  if (match) {
    const id = parseInt(match[1]);
    const extension = match[2].toLowerCase();
    
    // Create the standard image path
    const imagePath = `images/cards/local/${file}`;
    
    // Add to our map
    imageMap[id] = {
      path: imagePath,
      extension: extension
    };
    
    console.log(`  📷 Found image for card ${id}: ${file}`);
  } else if (file.match(/^\d+\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    // Handle simple numbered files without "_target" (like "27.webp")
    const idMatch = file.match(/^(\d+)\.(jpg|jpeg|png|gif|webp|svg)$/i);
    if (idMatch) {
      const id = parseInt(idMatch[1]);
      const extension = idMatch[2].toLowerCase();
      
      const imagePath = `images/cards/local/${file}`;
      
      imageMap[id] = {
        path: imagePath,
        extension: extension
      };
      
      console.log(`  📷 Found image for card ${id} (no '_target' in name): ${file}`);
    }
  } else {
    console.log(`  ⚠️  Unrecognized image file pattern: ${file}`);
  }
});

// STEP 4: Update card data to use local images
console.log('\n🔄 Updating card data to use local images...');
let cardData = fs.readFileSync(cardDataPath, 'utf8');

// Update each card's image paths
let updates = 0;
for (const [id, imageInfo] of Object.entries(imageMap)) {
  const idNum = parseInt(id);
  
  // Multiple patterns to find and update paths for this card ID
  const patterns = [
    // target_img pattern
    new RegExp(`(id:\\s*${idNum}[\\s\\S]*?target_img:\\s*")([^"]+)(")`),
    // local_target_img pattern 
    new RegExp(`(id:\\s*${idNum}[\\s\\S]*?local_target_img:\\s*")([^"]+)(")`),
  ];
  
  patterns.forEach(pattern => {
    const match = cardData.match(pattern);
    if (match) {
      // Only update if the current path is different 
      if (match[2] !== imageInfo.path) {
        cardData = cardData.replace(pattern, `$1${imageInfo.path}$3`);
        updates++;
        console.log(`  ✏️  Updated image path for card ${id}`);
      }
    }
  });
}

// Write the updated card data back to the file
fs.writeFileSync(cardDataPath, cardData);

// STEP 5: Summary
console.log('\n📊 Clean up and verification summary:');
console.log(`  - Deleted ${hiddenFiles.length} hidden files`);
console.log(`  - Found ${validImageFiles.length} valid image files`);
console.log(`  - Updated ${updates} image paths across ${Object.keys(imageMap).length} cards`);
console.log(`  - Original card data backed up to ${backupDataPath}`);
console.log('\n✅ Process complete! Images directory is clean and card data is updated.'); 