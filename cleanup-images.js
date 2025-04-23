const fs = require('fs');
const path = require('path');

const imagesDir = './images/cards/local';
const files = fs.readdirSync(imagesDir);

// Group files by card ID
const filesByCardId = {};
files.forEach(file => {
  const match = file.match(/^(\d+)_target/);
  if (match) {
    const id = parseInt(match[1]);
    if (!filesByCardId[id]) {
      filesByCardId[id] = [];
    }
    filesByCardId[id].push(file);
  }
});

// For each card with multiple files, keep only the best one
console.log('Cleaning up duplicate files...');
let deleted = 0;

Object.entries(filesByCardId).forEach(([id, cardFiles]) => {
  if (cardFiles.length <= 1) {
    return; // Skip if there's only one file
  }
  
  // Sort files to keep the simplest named one (usually the original download)
  // Prioritize files with the shortest name and those with just an extension (no additional text)
  cardFiles.sort((a, b) => {
    // Preferred pattern is exactly "{id}_target.{ext}"
    const aExactMatch = a.match(new RegExp(`^${id}_target\\.(jpg|png|gif)$`)) ? 1 : 0;
    const bExactMatch = b.match(new RegExp(`^${id}_target\\.(jpg|png|gif)$`)) ? 1 : 0;
    
    if (aExactMatch !== bExactMatch) {
      return bExactMatch - aExactMatch; // Prefer exact matches
    }
    
    return a.length - b.length; // Otherwise prefer shorter names
  });
  
  // Keep the first file (best match) and delete the rest
  const fileToKeep = cardFiles[0];
  console.log(`Card ${id}: Keeping ${fileToKeep}`);
  
  for (let i = 1; i < cardFiles.length; i++) {
    const fileToDelete = cardFiles[i];
    try {
      fs.unlinkSync(path.join(imagesDir, fileToDelete));
      console.log(`  - Deleted: ${fileToDelete}`);
      deleted++;
    } catch (err) {
      console.error(`  - Error deleting ${fileToDelete}: ${err.message}`);
    }
  }
});

console.log(`\nCleanup complete. Deleted ${deleted} duplicate files.`);

// Verify remaining files
const remainingFiles = fs.readdirSync(imagesDir)
  .filter(file => file.match(/^\d+_target/))
  .sort((a, b) => {
    const idA = parseInt(a.match(/^(\d+)_target/)[1]);
    const idB = parseInt(b.match(/^(\d+)_target/)[1]);
    return idA - idB;
  });

console.log(`\nRemaining files (${remainingFiles.length}):`);
remainingFiles.forEach(file => console.log(`- ${file}`)); 