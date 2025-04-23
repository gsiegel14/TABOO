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

// Extract remote_target_img URLs
const urlRegex = /id:\s*(\d+)[^]*?remote_target_img:\s*"([^"]+)"/g;
const cardUrls = [];
let match;

while ((match = urlRegex.exec(cardDataContent)) !== null) {
  const id = parseInt(match[1]);
  const url = match[2];
  if (url && url.startsWith('http')) {
    cardUrls.push({ id, url });
  }
}

console.log(`Found ${cardUrls.length} remote image URLs to download`);

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

// Function to download image with proper error handling
function downloadImage(url, id) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Downloading image for card ${id} from ${url}`);
      
      // Handle redirects for Google and other URLs
      if (url.includes('google.com/url') || url.includes('googleusercontent.com')) {
        console.log(`Google URL detected, attempting to extract direct URL...`);
        const urlObj = new URL(url);
        const directUrl = urlObj.searchParams.get('url') || url;
        if (directUrl !== url) {
          console.log(`Redirecting to ${directUrl}`);
          return downloadImage(directUrl, id).then(resolve).catch(reject);
        }
      }
      
      // Parse URL
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      // Set request options with user agent
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        },
        timeout: 10000
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

// Download all images sequentially
async function downloadAllImages() {
  console.log(`Starting download of ${cardUrls.length} images...`);
  const results = { success: 0, failed: 0, skipped: 0 };
  const failedCards = [];
  
  for (const { id, url } of cardUrls) {
    try {
      // Skip if URL is a placeholder or not valid
      if (!url || url.includes('placeholder') || url === '' || url.includes('example.com')) {
        console.log(`⏭️ Skipping card ${id}: URL appears to be a placeholder`);
        results.skipped++;
        continue;
      }
      
      // Wait for download to complete
      await downloadImage(url, id);
      results.success++;
    } catch (err) {
      console.error(`❌ Failed to download image for card ${id}: ${err.message}`);
      failedCards.push({ id, url, error: err.message });
      results.failed++;
    }
    
    // Add small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
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
    fs.writeFileSync('failed-downloads.json', JSON.stringify(failedCards, null, 2));
    console.log('\nWrote failed download details to failed-downloads.json');
  }
}

// Run the download
downloadAllImages().catch(err => {
  console.error('Script error:', err);
}); 