/**
 * Image Validation Script
 * 
 * This script checks if all images referenced in card-data.js actually exist
 * in the filesystem. It reports missing files and suggests potential fixes.
 */

const fs = require('fs');
const path = require('path');
const { tabooCards } = require('../js/card-data.js');

console.log(`🔍 Validating images for ${tabooCards.length} cards...`);

// Track results
const results = {
  total: 0,
  found: 0,
  missing: [],
  redirects: []
};

// Function to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    console.error(`Error checking file ${filePath}:`, err);
    return false;
  }
}

// Function to generate a suggested alternative
function suggestAlternative(filename) {
  // Check directory for similar files
  const dir = path.dirname(filename);
  const basename = path.basename(filename);
  
  try {
    // Get all files in the directory
    const files = fs.readdirSync(dir);
    
    // Look for closest filename match
    let closestMatch = null;
    let highestSimilarity = 0;
    
    for (const file of files) {
      const similarity = calculateSimilarity(basename, file);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        closestMatch = file;
      }
    }
    
    if (highestSimilarity > 0.5) {
      return path.join(dir, closestMatch);
    }
  } catch (err) {
    console.error("Error suggesting alternative:", err);
  }
  
  return null;
}

// Simple similarity function for filenames
function calculateSimilarity(str1, str2) {
  // Remove file extension for comparison
  const base1 = str1.substring(0, str1.lastIndexOf('.')) || str1;
  const base2 = str2.substring(0, str2.lastIndexOf('.')) || str2;
  
  // Check if one is substantially contained within the other
  if (base1.includes(base2) || base2.includes(base1)) {
    return 0.8;
  }
  
  // Count matching characters at similar positions
  const len = Math.min(base1.length, base2.length);
  let matches = 0;
  
  for (let i = 0; i < len; i++) {
    if (base1[i] === base2[i]) {
      matches++;
    }
  }
  
  return matches / Math.max(base1.length, base2.length);
}

// Verify each card's images
tabooCards.forEach(card => {
  // Check if target_img is defined and is a local path
  if (card.target_img && card.target_img.startsWith('images/')) {
    results.total++;
    
    const imagePath = path.join(__dirname, '..', card.target_img);
    const exists = fileExists(imagePath);
    
    if (exists) {
      results.found++;
      // Check if the file size is reasonable (min 5kb)
      const stats = fs.statSync(imagePath);
      if (stats.size < 5000) {
        results.redirects.push({
          id: card.id,
          path: card.target_img,
          size: stats.size,
          reason: "File too small (may be a placeholder or redirect)"
        });
      }
    } else {
      const alt = suggestAlternative(imagePath);
      results.missing.push({
        id: card.id,
        targetWord: card.targetWord,
        path: card.target_img,
        suggestion: alt ? path.relative(path.join(__dirname, '..'), alt) : null
      });
    }
  }
  
  // Also check local_target_img if different from target_img
  if (card.local_target_img && 
      card.local_target_img !== card.target_img && 
      card.local_target_img.startsWith('images/')) {
    results.total++;
    
    const imagePath = path.join(__dirname, '..', card.local_target_img);
    const exists = fileExists(imagePath);
    
    if (exists) {
      results.found++;
      // Check if the file size is reasonable (min 5kb)
      const stats = fs.statSync(imagePath);
      if (stats.size < 5000) {
        results.redirects.push({
          id: card.id,
          path: card.local_target_img,
          size: stats.size,
          reason: "File too small (may be a placeholder or redirect)"
        });
      }
    } else {
      const alt = suggestAlternative(imagePath);
      results.missing.push({
        id: card.id,
        targetWord: card.targetWord,
        path: card.local_target_img,
        suggestion: alt ? path.relative(path.join(__dirname, '..'), alt) : null
      });
    }
  }
});

// Report results
console.log(`\n📊 Results Summary:`);
console.log(`✅ Found: ${results.found}/${results.total} images (${(results.found/results.total*100).toFixed(1)}%)`);
console.log(`❌ Missing: ${results.missing.length} images`);
console.log(`⚠️ Suspicious files (too small): ${results.redirects.length}`);

if (results.missing.length > 0) {
  console.log("\n❌ Missing Files:");
  results.missing.forEach(item => {
    console.log(`  Card #${item.id} - "${item.targetWord}": ${item.path}`);
    if (item.suggestion) {
      console.log(`    Suggested fix: ${item.suggestion}`);
    }
  });
}

if (results.redirects.length > 0) {
  console.log("\n⚠️ Suspicious Files (likely placeholders or redirects):");
  results.redirects.forEach(item => {
    console.log(`  Card #${item.id}: ${item.path} (${item.size} bytes)`);
  });
}

// Generate fix script if needed
if (results.missing.length > 0) {
  console.log("\n🔧 Fix Script:");
  console.log("To fix missing images, you can:");
  console.log("1. Update the card data to point to existing files");
  console.log("2. Download the missing images");
  
  // Simple fix script to update card-data.js with suggested alternatives
  const fixScript = results.missing
    .filter(item => item.suggestion)
    .map(item => `// Card #${item.id}: Update path from "${item.path}" to "${item.suggestion}"`)
    .join('\n');
  
  if (fixScript) {
    console.log("\nSuggested fixes:");
    console.log(fixScript);
  }
  
  // Create a download script for missing remote images
  console.log("\nOr run a download script for missing files:");
  console.log("node scripts/direct-download.js");
} 