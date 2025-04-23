const fs = require('fs');
const path = require('path');

// Extract all card IDs from the card data
const cardDataFile = fs.readFileSync('./js/card-data.js', 'utf8');
const idRegex = /id:\s*(\d+)/g;
const allCardIds = [];
let match;

while ((match = idRegex.exec(cardDataFile)) !== null) {
  allCardIds.push(parseInt(match[1]));
}

// Extract target words
const targetWords = {};
const targetWordRegex = /id:\s*(\d+)[^]*?targetWord:\s*["'](.+?)["']/g;
while ((match = targetWordRegex.exec(cardDataFile)) !== null) {
  const id = parseInt(match[1]);
  const targetWord = match[2];
  targetWords[id] = targetWord;
}

// Check which target images exist
const imagesDir = './images/cards/local';
const files = fs.readdirSync(imagesDir);
const existingImages = new Set();

files.forEach(file => {
  const match = file.match(/^(\d+)_target/);
  if (match) {
    existingImages.add(parseInt(match[1]));
  }
});

// Find missing images
const missingImages = allCardIds.filter(id => !existingImages.has(id));

console.log(`Total cards: ${allCardIds.length}`);
console.log(`Cards with target images: ${existingImages.size}`);
console.log(`Missing card images: ${missingImages.length}`);

if (missingImages.length > 0) {
  console.log('\nMissing card IDs:');
  missingImages.forEach(id => {
    const targetWord = targetWords[id] || 'Unknown';
    console.log(`Card ${id}: ${targetWord}`);
  });
} else {
  console.log('\n✅ All card images are present!');
}

// Also check for duplicate/leftover files
const cardIdRegex = /^(\d+)_target/;
const filesByCardId = {};
let dupeCount = 0;

files.forEach(file => {
  const match = file.match(cardIdRegex);
  if (match) {
    const id = parseInt(match[1]);
    if (!filesByCardId[id]) {
      filesByCardId[id] = [];
    }
    filesByCardId[id].push(file);
    
    if (filesByCardId[id].length > 1) {
      dupeCount++;
    }
  }
});

if (dupeCount > 0) {
  console.log('\n⚠️ Found duplicate target files:');
  Object.entries(filesByCardId)
    .filter(([_, files]) => files.length > 1)
    .forEach(([id, files]) => {
      console.log(`Card ${id}: ${files.length} files`);
      files.forEach(file => console.log(`  - ${file}`));
    });
} 