/**
 * Clean up hidden files from the images directory
 * This script removes files like .DS_Store that are automatically created by macOS
 */

const fs = require('fs');
const path = require('path');

// Path to the local images directory
const localImagesDir = './images/cards/local';

// Read the contents of the directory
console.log(`Scanning directory: ${localImagesDir}`);
const files = fs.readdirSync(localImagesDir);

// Filter for hidden files (starting with .)
const hiddenFiles = files.filter(file => file.startsWith('.'));

if (hiddenFiles.length === 0) {
  console.log('No hidden files found.');
} else {
  console.log(`Found ${hiddenFiles.length} hidden files: ${hiddenFiles.join(', ')}`);
  
  // Delete each hidden file
  hiddenFiles.forEach(file => {
    const filePath = path.join(localImagesDir, file);
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${filePath}`);
    } catch (error) {
      console.error(`Error deleting ${filePath}: ${error.message}`);
    }
  });
  
  console.log('Clean up complete!');
}

// Function to check if a file is a valid image file
function isValidImageFile(filename) {
  if (filename.startsWith('.')) return false; // Skip hidden files
  
  // Valid image extensions
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = path.extname(filename).toLowerCase();
  return validExtensions.includes(ext);
}

// Filter remaining files to verify only image files remain
const remainingFiles = fs.readdirSync(localImagesDir);
const nonImageFiles = remainingFiles.filter(file => !isValidImageFile(file));

if (nonImageFiles.length === 0) {
  console.log('Only valid image files remain in the directory. ✅');
} else {
  console.log(`Warning: Found ${nonImageFiles.length} non-image files remaining: ${nonImageFiles.join(', ')}`);
} 