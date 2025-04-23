const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const path = require('path');

// Read the card data from the original file
const cardDataFile = fs.readFileSync('./js/card-data.js', 'utf8');

// A simpler approach: extract all URLs from the file
function extractUrls(content) {
  const urlRegex = /remote_target_img:\s*["'](.+?)["']/g;
  const matches = [];
  let match;
  
  while ((match = urlRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

// Extract card IDs
function extractCardIds(content) {
  const idRegex = /id:\s*(\d+)/g;
  const matches = [];
  let match;
  
  while ((match = idRegex.exec(content)) !== null) {
    matches.push(parseInt(match[1]));
  }
  
  return matches;
}

const urls = extractUrls(cardDataFile);
const ids = extractCardIds(cardDataFile);

if (urls.length !== ids.length) {
  console.warn(`Warning: Found ${urls.length} URLs but ${ids.length} card IDs. Some cards might be missing URLs.`);
}

// Create pairs of [id, url]
const cardData = ids.map((id, index) => {
  return {
    id,
    url: index < urls.length ? urls[index] : null
  };
});

// Common request options for all HTTP requests
const defaultRequestOptions = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
  },
  // Follow redirects
  maxRedirects: 5
};

// Function to check if an image URL is valid
function checkImageUrl(url, cardId) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        ...defaultRequestOptions,
        method: 'HEAD',
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search
      };
      
      const req = client.request(options, (res) => {
        // Handle redirects manually
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log(`⏩ Card ${cardId}: Following redirect to ${res.headers.location}`);
          checkImageUrl(res.headers.location, cardId).then(resolve);
          return;
        }
        
        const status = res.statusCode;
        const contentType = res.headers['content-type'] || '';
        const isImage = contentType.startsWith('image/');
        
        if (status >= 200 && status < 300 && isImage) {
          console.log(`✅ Card ${cardId}: Image URL is valid (${url})`);
          resolve(true);
        } else {
          console.error(`❌ Card ${cardId}: Invalid image URL. Status: ${status}, Content-Type: ${contentType} (${url})`);
          resolve(false);
        }
      });
      
      req.on('error', (err) => {
        console.error(`❌ Card ${cardId}: Error checking URL: ${err.message} (${url})`);
        resolve(false);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        console.error(`❌ Card ${cardId}: Timeout checking URL (${url})`);
        resolve(false);
      });
      
      req.end();
    } catch (error) {
      console.error(`❌ Card ${cardId}: Invalid URL format: ${error.message} (${url})`);
      resolve(false);
    }
  });
}

// Function to check local image files
function checkLocalImageFile(filepath, cardId) {
  const fullPath = path.resolve(filepath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`✅ Card ${cardId}: Local image exists (${filepath})`);
    return true;
  } else {
    console.error(`❌ Card ${cardId}: Local image not found (${filepath})`);
    return false;
  }
}

// Main function to check all card images
async function verifyAllCardImages() {
  console.log(`Checking ${cardData.length} taboo cards for valid image URLs...`);
  
  let validCount = 0;
  let invalidCount = 0;

  for (const card of cardData) {
    const { id, url } = card;
    
    if (!url) {
      console.error(`❌ Card ${id}: Missing remote_target_img URL`);
      invalidCount++;
      continue;
    }
    
    const isValid = await checkImageUrl(url, id);
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }
  }
  
  console.log('\n--- Summary ---');
  console.log(`Total cards: ${cardData.length}`);
  console.log(`Valid images: ${validCount}`);
  console.log(`Invalid images: ${invalidCount}`);
  
  if (invalidCount > 0) {
    console.log('\n⚠️ Some image URLs need to be fixed!');
  } else {
    console.log('\n✅ All image URLs are valid!');
  }
}

// Helper function to download a file with retries
async function downloadFileWithRetries(url, dest, cardId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // If not first attempt, wait a bit before retry
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`🔄 Card ${cardId}: Retry attempt ${attempt}/${maxRetries}`);
      }
      
      const success = await downloadFile(url, dest, cardId);
      if (success) return true;
    } catch (error) {
      console.error(`❌ Card ${cardId}: Error on attempt ${attempt}: ${error.message}`);
      if (attempt === maxRetries) return false;
    }
  }
  return false;
}

// Also attempt to download images for local storage
async function downloadImages() {
  const imagesDir = './images/cards/local';
  
  // Ensure the directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`Created directory: ${imagesDir}`);
  }
  
  console.log(`\nDownloading images to ${imagesDir}...`);
  
  let downloadedCount = 0;
  let failedCount = 0;
  
  for (const card of cardData) {
    const { id, url } = card;
    
    if (!url) {
      console.error(`❌ Card ${id}: No URL to download from`);
      failedCount++;
      continue;
    }
    
    // Extract file extension from URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = path.extname(pathname) || '.jpg';
    
    const localFilename = `${id}_target${extension}`;
    const localPath = path.join(imagesDir, localFilename);
    
    try {
      // Skip if file already exists
      if (fs.existsSync(localPath)) {
        console.log(`✅ Card ${id}: Image already downloaded (${localPath})`);
        downloadedCount++;
        continue;
      }
      
      // Download the file with retries
      const success = await downloadFileWithRetries(url, localPath, id);
      if (success) {
        downloadedCount++;
      } else {
        failedCount++;
      }
    } catch (error) {
      console.error(`❌ Card ${id}: Error downloading image: ${error.message}`);
      failedCount++;
    }
  }
  
  console.log('\n--- Download Summary ---');
  console.log(`Downloaded: ${downloadedCount}`);
  console.log(`Failed: ${failedCount}`);
}

// Helper function to download a file
function downloadFile(url, dest, cardId) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        ...defaultRequestOptions,
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search
      };
      
      const req = client.get(options, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log(`⏩ Card ${cardId}: Following redirect to ${res.headers.location}`);
          downloadFile(res.headers.location, dest, cardId).then(resolve).catch(reject);
          return;
        }
        
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.error(`❌ Card ${cardId}: Failed to download, status: ${res.statusCode}`);
          resolve(false);
          return;
        }
        
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Card ${cardId}: Downloaded image to ${dest}`);
          resolve(true);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(dest, () => {}); // Clean up partial file
          console.error(`❌ Card ${cardId}: Error writing file: ${err.message}`);
          resolve(false);
        });
      });
      
      req.on('error', (err) => {
        console.error(`❌ Card ${cardId}: Error downloading: ${err.message}`);
        resolve(false);
      });
      
      req.setTimeout(20000, () => {
        req.destroy();
        console.error(`❌ Card ${cardId}: Download timeout`);
        resolve(false);
      });
    } catch (error) {
      console.error(`❌ Card ${cardId}: Invalid URL format: ${error.message}`);
      resolve(false);
    }
  });
}

// Run both verification and download
async function main() {
  await verifyAllCardImages();
  await downloadImages();
}

main(); 