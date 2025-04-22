#!/usr/bin/env node
/**
 * Image Verification Script
 * 
 * This script performs comprehensive checks on the Taboo game images:
 * 1. Verifies that all local image paths in card-data.js exist on disk
 * 2. Checks all file sizes to detect placeholder files
 * 3. Analyzes the naming patterns to suggest corrections
 * 4. Optionally downloads missing images
 * 
 * Usage:
 *   node verify-images.js             # Check images only
 *   node verify-images.js --fix       # Check and generate fixes
 *   node verify-images.js --download  # Check and download missing images
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { tabooCards } = require('../js/card-data.js');

// Configuration
const MIN_FILE_SIZE = 5000; // 5KB minimum for a valid image
const CARDS_DIR = path.join(__dirname, '..', 'images/cards/local');
const FIX_MODE = process.argv.includes('--fix');
const DOWNLOAD_MODE = process.argv.includes('--download');

// Results tracking
const results = {
  cardsChecked: 0,
  imagesChecked: 0,
  imagesVerified: 0,
  tooSmall: [],
  missing: [],
  mismatched: [],
  cardsMissingImages: []
};

console.log(`\n🔍 Taboo Images Verification Tool`);
console.log(`Mode: ${FIX_MODE ? 'Fix' : (DOWNLOAD_MODE ? 'Download' : 'Check')}`);
console.log(`Checking ${tabooCards.length} cards...`);

// Ensure the local images directory exists
if (!fs.existsSync(CARDS_DIR)) {
  fs.mkdirSync(CARDS_DIR, { recursive: true });
  console.log(`Created directory: ${CARDS_DIR}`);
}

// Map of all image files keyed by card ID
const imagesByCardId = {};

// Step 1: Scan all available images and index them by card ID
function scanAvailableImages() {
  console.log('\n📊 Scanning available images...');
  
  try {
    const files = fs.readdirSync(CARDS_DIR).filter(file => 
      !file.startsWith('.') && 
      (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.gif') || file.endsWith('.svg'))
    );
    
    console.log(`Found ${files.length} image files in ${CARDS_DIR}`);
    
    files.forEach(file => {
      // Extract card ID and image type from filename pattern (e.g., "24_target_something.jpg")
      const match = file.match(/^(\d+)_(\w+)_/);
      if (match) {
        const cardId = parseInt(match[1], 10);
        const imageType = match[2]; // target or probe
        
        if (!imagesByCardId[cardId]) {
          imagesByCardId[cardId] = [];
        }
        
        // Get file stats
        const filePath = path.join(CARDS_DIR, file);
        const stats = fs.statSync(filePath);
        
        imagesByCardId[cardId].push({
          filename: file,
          filePath,
          size: stats.size,
          type: imageType,
          isTooSmall: stats.size < MIN_FILE_SIZE
        });
        
        // Track suspicious files
        if (stats.size < MIN_FILE_SIZE) {
          results.tooSmall.push({
            cardId,
            filename: file,
            size: stats.size
          });
        }
      }
    });
  } catch (error) {
    console.error(`Error scanning images: ${error.message}`);
  }
}

// Step 2: Check all cards against available images
function verifyCardImages() {
  console.log('\n📋 Verifying card images...');
  
  tabooCards.forEach(card => {
    results.cardsChecked++;
    
    // Check target image
    if (card.target_img) {
      results.imagesChecked++;
      verifyImage(card, card.target_img, 'target_img');
    }
    
    // Check local target image if different
    if (card.local_target_img && card.local_target_img !== card.target_img) {
      results.imagesChecked++;
      verifyImage(card, card.local_target_img, 'local_target_img');
    }
    
    // Check probe image
    if (card.probe_img) {
      results.imagesChecked++;
      verifyImage(card, card.probe_img, 'probe_img');
    }
    
    // Check local probe image if different
    if (card.local_probe_img && card.local_probe_img !== card.probe_img) {
      results.imagesChecked++;
      verifyImage(card, card.local_probe_img, 'local_probe_img');
    }
    
    // Check if card has any images at all
    if (!card.target_img && !card.local_target_img) {
      results.cardsMissingImages.push({
        id: card.id,
        targetWord: card.targetWord
      });
    }
  });
}

// Helper function to verify a single image
function verifyImage(card, imagePath, fieldName) {
  // Skip non-local paths
  if (!imagePath.startsWith('images/')) {
    return;
  }
  
  const fullPath = path.join(__dirname, '..', imagePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    // Verify file size
    const stats = fs.statSync(fullPath);
    if (stats.size >= MIN_FILE_SIZE) {
      results.imagesVerified++;
    } else {
      // File exists but is too small (likely a placeholder)
      results.tooSmall.push({
        cardId: card.id,
        fieldName,
        path: imagePath,
        size: stats.size
      });
      
      // Find a better alternative for this card
      suggestAlternative(card, imagePath, fieldName);
    }
  } else {
    // Image doesn't exist
    results.missing.push({
      cardId: card.id,
      targetWord: card.targetWord,
      fieldName,
      path: imagePath
    });
    
    // Find a better alternative for this card
    suggestAlternative(card, imagePath, fieldName);
  }
}

// Helper function to suggest alternative images
function suggestAlternative(card, imagePath, fieldName) {
  const cardId = card.id;
  
  // Check if we have any images for this card
  if (imagesByCardId[cardId] && imagesByCardId[cardId].length > 0) {
    // Filter for target or probe images based on the field name
    const isTarget = fieldName.includes('target');
    const imageType = isTarget ? 'target' : 'probe';
    
    // Get valid alternatives (correct type and size)
    const validAlternatives = imagesByCardId[cardId].filter(img => 
      img.type === imageType && !img.isTooSmall
    );
    
    if (validAlternatives.length > 0) {
      // Choose the largest alternative
      const bestAlternative = validAlternatives.sort((a, b) => b.size - a.size)[0];
      
      results.mismatched.push({
        cardId,
        targetWord: card.targetWord,
        fieldName,
        currentPath: imagePath,
        suggestedPath: `images/cards/local/${bestAlternative.filename}`,
        reason: `Found ${validAlternatives.length} valid alternative(s)`
      });
    }
  }
}

// Step 3: Generate fixes if requested
function generateFixes() {
  if (!FIX_MODE) return;
  
  console.log('\n🔧 Generating fixes...');
  
  // Deep copy the cards
  const updatedCards = JSON.parse(JSON.stringify(tabooCards));
  let fixCount = 0;
  
  // Apply all suggested fixes
  results.mismatched.forEach(fix => {
    const card = updatedCards.find(c => c.id === fix.cardId);
    if (card) {
      card[fix.fieldName] = fix.suggestedPath;
      fixCount++;
    }
  });
  
  if (fixCount > 0) {
    // Format the card data as a string
    const cardDataString = `/*
 * Taboo Game Card Data (Revised for Scanning Normal Anatomy on Models)
 * Prompts focus on finding standard views or normal structures,
 * suitable for blindfolded scanning practice on ultrasound models/phantoms.
 * Auto-fixed version generated by verify-images.js on ${new Date().toISOString()}
 */

const tabooCards = ${JSON.stringify(updatedCards, null, 2)};

// Example of how to use:
// console.log(tabooCards[0].prompt);
// console.log(tabooCards[0].targetWord);
// console.log(tabooCards[0].tabooWords);
// console.log(tabooCards[0].remote_target_img);

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tabooCards };
}`;

    const outputPath = path.join(__dirname, '..', 'js', 'card-data.js.fixed');
    fs.writeFileSync(outputPath, cardDataString);
    
    console.log(`✅ Fixed ${fixCount} image paths. Updated card data written to js/card-data.js.fixed`);
    console.log('To apply fixes: mv js/card-data.js.fixed js/card-data.js');
  } else {
    console.log('ℹ️ No fixes needed!');
  }
}

// Step 4: Download missing images if requested
function downloadMissingImages() {
  if (!DOWNLOAD_MODE) return;
  
  console.log('\n⬇️ Downloading missing images...');
  
  // Collect all cards with missing images
  const cardsNeedingDownload = new Set();
  
  results.missing.forEach(item => {
    cardsNeedingDownload.add(item.cardId);
  });
  
  results.tooSmall.forEach(item => {
    if (typeof item.cardId === 'number') {
      cardsNeedingDownload.add(item.cardId);
    }
  });
  
  if (cardsNeedingDownload.size === 0) {
    console.log('ℹ️ No images need to be downloaded!');
    return;
  }
  
  console.log(`Found ${cardsNeedingDownload.size} cards needing downloads.`);
  console.log('Running download-missing.js script...');
  
  // Run the download script
  exec('node scripts/download-missing.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Download script error: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Download script stderr: ${stderr}`);
    }
    
    console.log(stdout);
  });
}

// Step 5: Print results
function printResults() {
  console.log('\n📊 Verification Results:');
  console.log(`Cards checked: ${results.cardsChecked}`);
  console.log(`Images checked: ${results.imagesChecked}`);
  console.log(`Images verified: ${results.imagesVerified}`);
  console.log(`Missing images: ${results.missing.length}`);
  console.log(`Too small (likely placeholders): ${results.tooSmall.length}`);
  console.log(`Suggested path fixes: ${results.mismatched.length}`);
  console.log(`Cards without images: ${results.cardsMissingImages.length}`);
  
  if (results.missing.length > 0) {
    console.log('\n❌ Missing Images:');
    results.missing.forEach(item => {
      console.log(`  Card #${item.cardId} - "${item.targetWord}": ${item.path}`);
    });
  }
  
  if (results.tooSmall.length > 0) {
    console.log('\n⚠️ Suspicious Files (too small - likely placeholders):');
    results.tooSmall.forEach(item => {
      if (typeof item.cardId === 'number') {
        console.log(`  Card #${item.cardId}: ${item.path || item.filename} (${item.size} bytes)`);
      } else {
        console.log(`  File: ${item.filename} (${item.size} bytes)`);
      }
    });
  }
  
  if (results.mismatched.length > 0) {
    console.log('\n🔄 Suggested Path Fixes:');
    results.mismatched.forEach(item => {
      console.log(`  Card #${item.cardId} - "${item.targetWord}":`);
      console.log(`    Current: ${item.currentPath}`);
      console.log(`    Suggested: ${item.suggestedPath}`);
    });
  }
  
  if (results.cardsMissingImages.length > 0) {
    console.log('\n⚠️ Cards Without Images:');
    results.cardsMissingImages.forEach(item => {
      console.log(`  Card #${item.id} - "${item.targetWord}"`);
    });
  }
}

// Main execution
scanAvailableImages();
verifyCardImages();
printResults();
generateFixes();
downloadMissingImages();

console.log('\n✅ Verification complete!');
if (!FIX_MODE && results.mismatched.length > 0) {
  console.log('To generate fixes: node verify-images.js --fix');
}
if (!DOWNLOAD_MODE && (results.missing.length > 0 || results.tooSmall.length > 0)) {
  console.log('To download missing images: node verify-images.js --download');
}

// For browser debugging
console.log('\nDebugging Tip: Open the game with ?debug=true added to the URL');
console.log('Example: http://localhost:7777/?debug=true'); 