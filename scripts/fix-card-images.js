#!/usr/bin/env node
/**
 * Script to fix card images by ensuring all cards use valid local images
 * This checks if images exist and have sufficient size
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  cardDataPath: path.join(__dirname, '../js/card-data.js'),
  localImagesDir: path.join(__dirname, '../images/cards/local'),
  minImageSize: 5000 // Bytes - Images smaller than this are considered broken
};

// Load card data
let cardDataContent = fs.readFileSync(CONFIG.cardDataPath, 'utf8');
const tabooCardsMatch = cardDataContent.match(/const tabooCards = (\[[\s\S]*?\]);/);
if (!tabooCardsMatch) {
  console.error('Could not parse tabooCards from card-data.js');
  process.exit(1);
}

// Parse the cards array
const tabooCards = eval(tabooCardsMatch[1]);
console.log(`Found ${tabooCards.length} cards in card-data.js`);

// Get a list of all available local images with their sizes
const availableImages = {};
const tinyImages = [];

fs.readdirSync(CONFIG.localImagesDir).forEach(filename => {
  const filepath = path.join(CONFIG.localImagesDir, filename);
  const stats = fs.statSync(filepath);
  
  // Skip directories
  if (stats.isDirectory()) return;
  
  // Store file size
  availableImages[filename] = stats.size;
  
  // Track tiny images
  if (stats.size < CONFIG.minImageSize) {
    tinyImages.push(filename);
  }
});

console.log(`Found ${Object.keys(availableImages).length} local images`);
console.log(`Found ${tinyImages.length} tiny/broken images that will be avoided`);

// Track card ID to possible images mapping
const cardImages = {};

// First pass: Collect all potential images for each card
Object.keys(availableImages).forEach(filename => {
  const fileSize = availableImages[filename];
  
  // Skip tiny/invalid images
  if (fileSize < CONFIG.minImageSize) return;
  
  // Check if filename includes a card ID
  const match = filename.match(/^(\d+)_/);
  if (match) {
    const cardId = parseInt(match[1], 10);
    if (!cardImages[cardId]) {
      cardImages[cardId] = [];
    }
    
    // Add to potential images for this card
    cardImages[cardId].push({
      filename,
      size: fileSize,
      isTargetImage: filename.includes('_target_'),
      isProbeImage: filename.includes('_probe_')
    });
  }
});

// Now fix each card
const results = {
  success: 0,
  failed: 0,
  unchanged: 0
};

tabooCards.forEach(card => {
  const cardId = card.id;
  const availableImagesForCard = cardImages[cardId] || [];
  
  console.log(`\nProcessing card ${cardId}: ${card.targetWord}`);
  
  // Check target image
  if (checkAndFixImage(card, 'target_img', 'local_target_img', availableImagesForCard, true)) {
    results.success++;
  } else if (availableImagesForCard.length === 0) {
    console.log(`❌ No suitable images found for card ${cardId}`);
    results.failed++;
  } else {
    results.unchanged++;
  }
  
  // Check probe image (if any)
  if (card.probe_img) {
    checkAndFixImage(card, 'probe_img', 'local_probe_img', availableImagesForCard, false);
  }
});

// Helper: Check and fix an image reference
function checkAndFixImage(card, imgField, localImgField, availableImagesForCard, isTarget) {
  const currentPath = card[imgField];
  const currentLocalPath = card[localImgField];
  
  // Extract filename from path
  const currentFilename = currentPath ? path.basename(currentPath) : null;
  
  // Check if the current image exists and is valid
  const isCurrentValid = currentFilename && 
                         availableImages[currentFilename] && 
                         availableImages[currentFilename] >= CONFIG.minImageSize;
  
  if (isCurrentValid) {
    console.log(`✅ Current ${isTarget ? 'target' : 'probe'} image is valid: ${currentFilename}`);
    return false; // No change needed
  }
  
  // Find the best replacement
  const imageType = isTarget ? 'target' : 'probe';
  const potentialImages = availableImagesForCard.filter(img => 
    (isTarget && img.isTargetImage) || (!isTarget && img.isProbeImage)
  );
  
  if (potentialImages.length === 0) {
    // If no matching type, try any image for this card
    console.log(`⚠️ No specific ${imageType} image found, trying any image for card ${card.id}`);
    
    // Sort by size (largest first) as better images are usually larger
    const sortedImages = [...availableImagesForCard].sort((a, b) => b.size - a.size);
    
    if (sortedImages.length > 0) {
      const bestImage = sortedImages[0];
      const imagePath = `images/cards/local/${bestImage.filename}`;
      
      console.log(`🔄 Updating ${imageType} image to: ${bestImage.filename} (${formatSize(bestImage.size)})`);
      
      card[imgField] = imagePath;
      card[localImgField] = imagePath;
      return true;
    }
    
    return false;
  }
  
  // Sort potential matching images by size (largest first)
  const sortedImages = [...potentialImages].sort((a, b) => b.size - a.size);
  const bestImage = sortedImages[0];
  const imagePath = `images/cards/local/${bestImage.filename}`;
  
  console.log(`🔄 Updating ${imageType} image to: ${bestImage.filename} (${formatSize(bestImage.size)})`);
  
  card[imgField] = imagePath;
  card[localImgField] = imagePath;
  return true;
}

// Save updated card data
console.log("\nSaving updated card data...");
const updatedContent = cardDataContent.replace(
  /const tabooCards = \[[\s\S]*?\];/,
  `const tabooCards = ${JSON.stringify(tabooCards, null, 2)};`
);

fs.writeFileSync(CONFIG.cardDataPath, updatedContent, 'utf8');
console.log(`✅ Updated card data saved to ${CONFIG.cardDataPath}`);

// Final report
console.log("\n=== RESULTS ===");
console.log(`Total cards: ${tabooCards.length}`);
console.log(`✅ Updated: ${results.success}`);
console.log(`✓ Unchanged (already valid): ${results.unchanged}`);
console.log(`❌ Failed (no suitable images): ${results.failed}`);

// Helper: Format file size
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
} 