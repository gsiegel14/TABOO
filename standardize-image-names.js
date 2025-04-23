const fs = require('fs');
const path = require('path');

const imagesDir = './images/cards/local';
const files = fs.readdirSync(imagesDir)
  .filter(file => file.match(/^\d+_target/));

console.log('Standardizing image filenames...');
let renamed = 0;

files.forEach(file => {
  const match = file.match(/^(\d+)_target/);
  if (!match) return;
  
  const id = match[1];
  const extension = path.extname(file);
  const standardName = `${id}_target${extension}`;
  
  if (file !== standardName) {
    try {
      fs.renameSync(
        path.join(imagesDir, file),
        path.join(imagesDir, standardName)
      );
      console.log(`Renamed: ${file} → ${standardName}`);
      renamed++;
    } catch (err) {
      console.error(`Error renaming ${file}: ${err.message}`);
    }
  } else {
    console.log(`Already standardized: ${file}`);
  }
});

console.log(`\nStandardization complete. Renamed ${renamed} files.`);

// Verify final filenames
const finalFiles = fs.readdirSync(imagesDir)
  .filter(file => file.match(/^\d+_target/))
  .sort((a, b) => {
    const idA = parseInt(a.match(/^(\d+)_target/)[1]);
    const idB = parseInt(b.match(/^(\d+)_target/)[1]);
    return idA - idB;
  });

console.log(`\nFinal files (${finalFiles.length}):`);
finalFiles.forEach(file => console.log(`- ${file}`)); 