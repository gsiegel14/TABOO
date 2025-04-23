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

// Extract card IDs and all relevant URLs
function extractCardUrls() {
  const regex = /id:\s*(\d+)[^]*?remote_target_img:\s*"([^"]+)"/g;
  const cards = [];
  let match;

  while ((match = regex.exec(cardDataContent)) !== null) {
    const id = parseInt(match[1]);
    const remoteUrl = match[2];
    
    if (remoteUrl && remoteUrl.startsWith('http')) {
      cards.push({ id, remoteUrl });
    }
  }
  
  return cards;
}

const cards = extractCardUrls();
console.log(`Found ${cards.length} cards with remote URLs`);

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

// Function to download image with proper error handling
function downloadImage(url, id) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Downloading image for card ${id} from ${url}`);
      
      // Check for existing files first
      const existingFile = checkExistingFile(id);
      if (existingFile) {
        console.log(`⏭️ File already exists for card ${id}: ${existingFile}`);
        return resolve(path.join(imagesDir, existingFile));
      }
      
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
      
      // Parse URL and handle special cases for commons.wikimedia.org links
      let parsedUrl = new URL(url);
      if (url.includes('commons.wikimedia.org/wiki/File:')) {
        // This is a wiki page, not a direct image URL
        const filename = path.basename(parsedUrl.pathname);
        console.log(`Converting wiki page URL to direct file URL for: ${filename}`);
        // Try to create direct URL by converting wiki page to direct media link
        url = `https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/${filename.replace('File:', '')}/800px-${filename.replace('File:', '')}`;
        parsedUrl = new URL(url);
      }
      
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      // Set request options with user agent
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Referer': 'https://www.google.com/'
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

// Alternative image sources to try when the main URL fails
const alternativeURLs = {
  // A-lines in lung ultrasound
  9: [
    "https://i0.wp.com/nephropocus.com/wp-content/uploads/2020/09/Twit-1.gif?fit=600%2C376&ssl=1",
    "https://www.researchgate.net/profile/Luna-Gargani/publication/313350920/figure/fig1/AS:668380259504147@1536366520222/A-lines-are-horizontal-reverberation-artifacts-arising-from-the-pleural-line-at-regular.jpg"
  ],
  // M-mode seashore sign
  8: [
    "https://pocus101.b-cdn.net/wp-content/uploads/2020/10/A-lines-with-Lung-Sliding-Labeled.gif",
    "https://www.researchgate.net/profile/Luca-Saba-2/publication/328111272/figure/fig1/AS:680235089375232@1539200977100/Lung-ultrasonography-Time-motion-mode-showing-seashore-sign-of-normal-lung-Alternating.jpg"
  ],
  // Parasternal long axis view
  5: [
    "https://prod-images-static.radiopaedia.org/images/42060906/d8220e9db92dcbe66e9226b936ad22.jpg",
    "https://123sonography.com/sites/default/files/2023-03/PLAX.png"
  ],
  // Apical 4-chamber view
  6: [
    "https://www.echocardia.com/images/apical4_1.jpg",
    "https://www.researchgate.net/profile/Annalisa-Vezzani/publication/322296515/figure/fig1/AS:682118986518530@1539654964078/Apical-four-chamber-view.jpg"
  ],
  // More common alternatives...
};

// Download all images sequentially with retries
async function downloadAllImages() {
  console.log(`Starting download of ${cards.length} images...`);
  const results = { success: 0, failed: 0, skipped: 0 };
  const failedCards = [];
  
  for (const card of cards) {
    try {
      // Skip if URL is a placeholder or not valid
      if (!card.remoteUrl || card.remoteUrl.includes('placeholder') || card.remoteUrl === '') {
        console.log(`⏭️ Skipping card ${card.id}: URL appears to be a placeholder`);
        results.skipped++;
        continue;
      }
      
      // Check if we already have this file
      const existingFile = checkExistingFile(card.id);
      if (existingFile) {
        console.log(`⏭️ File already exists for card ${card.id}: ${existingFile}`);
        results.skipped++;
        continue;
      }
      
      // First try the primary URL
      try {
        await downloadImage(card.remoteUrl, card.id);
        results.success++;
        continue;
      } catch (mainErr) {
        console.log(`❌ Primary URL failed: ${mainErr.message}`);
        
        // Try alternative URLs if they exist
        if (alternativeURLs[card.id]) {
          let altSuccess = false;
          for (const altUrl of alternativeURLs[card.id]) {
            try {
              console.log(`🔄 Trying alternative URL for card ${card.id}: ${altUrl}`);
              await downloadImage(altUrl, card.id);
              altSuccess = true;
              results.success++;
              break;
            } catch (altErr) {
              console.log(`❌ Alternative URL failed: ${altErr.message}`);
            }
          }
          
          if (altSuccess) continue;
        }
        
        // If we get here, all attempts failed
        throw new Error(`All download attempts failed for card ${card.id}`);
      }
    } catch (err) {
      console.error(`❌ Failed to download image for card ${card.id}: ${err.message}`);
      failedCards.push({ id: card.id, url: card.remoteUrl, error: err.message });
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