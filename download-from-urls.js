const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Create directory if it doesn't exist
const imagesDir = './images/cards/local';
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Read the card data file
const cardDataPath = './js/card-data.js';
let cardDataContent = fs.readFileSync(cardDataPath, 'utf8');

// Extract card IDs and URLs directly from the card data
function extractCardUrls() {
  const cards = [];
  
  // Extract card ID and remote_target_img with various patterns
  const patterns = [
    // Pattern for standard quotes
    /id:\s*(\d+)[^]*?remote_target_img:\s*"([^"]+)"/g,
    // Pattern for complex quotes or no quotes
    /id:\s*(\d+)[^]*?remote_target_img:\s*(?:"|'|)([^",'\s]+)(?:"|'|)/g,
    // Pattern for Google URLs
    /id:\s*(\d+)[^]*?remote_target_img:\s*(?:"|'|)(https:\/\/www\.google\.com\/url[^"'\s]+)(?:"|'|)/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(cardDataContent)) !== null) {
      const id = parseInt(match[1]);
      let url = match[2];
      
      // Skip empty URLs
      if (!url || url === "" || url.includes('placeholder')) continue;
      
      // Basic validation
      if (url && url.startsWith('http')) {
        // Check if this card ID already exists
        if (!cards.some(card => card.id === id)) {
          cards.push({ id, url });
        }
      }
    }
  }
  
  return cards;
}

const cards = extractCardUrls();
console.log(`Found ${cards.length} cards with URLs`);

// Function to determine file extension from URL or content-type
function getFileExtension(url, contentType) {
  // Try to get extension from URL path
  const urlPath = new URL(url).pathname;
  const extFromPath = path.extname(urlPath).toLowerCase();
  
  if (extFromPath && ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extFromPath)) {
    return extFromPath;
  }
  
  // Fall back to content-type
  if (contentType) {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
    if (contentType.includes('png')) return '.png';
    if (contentType.includes('gif')) return '.gif';
    if (contentType.includes('webp')) return '.webp';
  }
  
  // Default to jpg if we can't determine
  return '.jpg';
}

// Check if we already have a file for this ID
function checkExistingFile(cardId) {
  const files = fs.readdirSync(imagesDir);
  const targetPattern = new RegExp(`^${cardId}_target\\.(jpg|jpeg|png|gif|webp)$`, 'i');
  return files.find(file => targetPattern.test(file));
}

// Convert Wikimedia Commons page URL to direct file URL
function getDirectFileUrl(url) {
  try {
    if (url.includes('commons.wikimedia.org/wiki/File:')) {
      // Extract filename from wiki page URL
      const filename = url.split('File:')[1];
      if (filename) {
        const encoded = encodeURIComponent(filename);
        return `https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/${encoded}/800px-${encoded}`;
      }
    }
    return url;
  } catch (e) {
    console.error(`Error converting wiki URL: ${e.message}`);
    return url;
  }
}

// Function to download image with proper error handling
function downloadImage(url, id) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`\nDownloading image for card ${id} from ${url}`);
      
      // Check for existing files first
      const existingFile = checkExistingFile(id);
      if (existingFile) {
        console.log(`⏭️ File already exists for card ${id}: ${existingFile}`);
        return resolve(path.join(imagesDir, existingFile));
      }
      
      // Parse URL 
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (e) {
        return reject(new Error(`Invalid URL: ${url}`));
      }
      
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      // Set request options with user agent
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Referer': 'https://www.google.com/'
        },
        timeout: 15000
      };
      
      // Make request
      const req = protocol.get(url, options, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log(`Redirect: ${res.statusCode} -> ${res.headers.location}`);
          return downloadImage(res.headers.location, id).then(resolve).catch(reject);
        }
        
        // Check if response is valid
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP status code ${res.statusCode}`));
        }
        
        // Get content type and determine file extension
        const contentType = res.headers['content-type'] || '';
        if (!contentType.includes('image')) {
          return reject(new Error(`Not an image: ${contentType}`));
        }
        
        const extension = getFileExtension(url, contentType);
        const filePath = path.join(imagesDir, `${id}_target${extension}`);
        
        // Create write stream
        const fileStream = fs.createWriteStream(filePath);
        res.pipe(fileStream);
        
        // Handle events
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Saved image for card ${id} to ${filePath}`);
          resolve(filePath);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(filePath, () => {}); // Clean up failed file
          reject(err);
        });
      });
      
      // Handle request errors
      req.on('error', reject);
      
      // Handle timeout
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
    } catch (err) {
      reject(err);
    }
  });
}

// No fallback alternatives in strict mode
const alternativeUrls = {};

// Download all images with retries
async function downloadAllImages() {
  console.log(`Starting download of ${cards.length} images...`);
  const results = { success: 0, failed: 0, skipped: 0 };
  const failedCards = [];
  
  for (const card of cards) {
    try {
      // Skip if we already have this file
      const existingFile = checkExistingFile(card.id);
      if (existingFile) {
        console.log(`⏭️ File already exists for card ${card.id}: ${existingFile}`);
        results.skipped++;
        continue;
      }
      
      // Try primary URL
      try {
        await downloadImage(card.url, card.id);
        results.success++;
        continue;
      } catch (mainErr) {
        console.log(`❌ Primary URL failed: ${mainErr.message}`);
        
        throw new Error(`All download attempts failed for card ${card.id}`);
      }
    } catch (err) {
      console.error(`❌ Failed to download image for card ${card.id}: ${err.message}`);
      failedCards.push({ id: card.id, url: card.url, error: err.message });
      results.failed++;
    }
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Print summary
  console.log('\n=== Download Summary ===');
  console.log(`✅ Successfully downloaded: ${results.success} images`);
  console.log(`❌ Failed to download: ${results.failed} images`);
  console.log(`⏭️ Skipped: ${results.skipped} images`);
  
  if (failedCards.length > 0) {
    console.log('\nFailed cards:');
    failedCards.forEach(card => {
      console.log(`Card ${card.id}: ${card.url} - ${card.error}`);
    });
    
    // Write failed cards to a file for reference
    fs.writeFileSync('failed-cards.json', JSON.stringify(failedCards, null, 2));
    console.log('\nWrote failed download details to failed-cards.json');
  }
}

// Run the download
downloadAllImages().catch(err => {
  console.error('Script error:', err);
}); 