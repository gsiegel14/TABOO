/**
 * Download Missing Images Script
 * 
 * This script first validates which images are missing from the card data,
 * then downloads only those missing images from their remote URLs.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { tabooCards } = require('../js/card-data.js');

// Maximum concurrent downloads
const MAX_CONCURRENT = 4;
let activeDownloads = 0;
let downloadQueue = [];

// Track results
const results = {
  total: 0,
  existing: 0,
  downloaded: 0,
  failed: 0,
  missing: []
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

// Ensure directory exists
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
    console.log(`Created directory: ${dirname}`);
  }
}

// Convert Wiki URL to direct download URL
function getDirectDownloadUrl(url) {
  if (url.includes('wikimedia.org')) {
    // Use the Special:FilePath endpoint for Wikimedia URLs to avoid 403 errors
    if (url.includes('/thumb/')) {
      // Extract the main filename from thumb URL
      const parts = url.split('/thumb/');
      if (parts.length > 1) {
        let filePath = parts[1].split('/');
        filePath.pop(); // Remove the thumbnail size segment
        return `https://commons.wikimedia.org/wiki/Special:FilePath/${filePath.join('/')}?download`;
      }
    }
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${url.split('/').pop()}?download`;
  }
  return url;
}

// Download a file with retries and proxy fallback
function downloadFile(url, destPath, cardId, retries = 2) {
  if (activeDownloads >= MAX_CONCURRENT) {
    // Queue this download
    downloadQueue.push({ url, destPath, cardId, retries });
    return;
  }
  
  activeDownloads++;
  console.log(`Downloading ${url} to ${destPath}...`);
  
  // Choose http or https module based on URL
  const requester = url.startsWith('https:') ? https : http;
  
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  };
  
  const request = requester.get(url, options, (response) => {
    if (response.statusCode === 301 || response.statusCode === 302) {
      // Handle redirects
      if (response.headers.location) {
        console.log(`Redirect to ${response.headers.location}`);
        downloadFile(response.headers.location, destPath, cardId, retries);
        activeDownloads--;
        processQueue();
        return;
      }
    }
    
    if (response.statusCode !== 200) {
      console.error(`❌ Failed to download card #${cardId}: HTTP ${response.statusCode}`);
      
      if (retries > 0) {
        // Try with a proxy on retry
        console.log(`Retrying with proxy for card #${cardId}...`);
        const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
        downloadFile(proxyUrl, destPath, cardId, retries - 1);
      } else {
        console.error(`❌ All retries failed for card #${cardId}`);
        results.failed++;
        
        // Create a placeholder file to mark the failed download
        ensureDirectoryExists(destPath);
        fs.writeFileSync(destPath, "Failed to download");
      }
      
      activeDownloads--;
      processQueue();
      return;
    }
    
    ensureDirectoryExists(destPath);
    const fileStream = fs.createWriteStream(destPath);
    
    response.pipe(fileStream);
    
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`✅ Downloaded: ${destPath}`);
      results.downloaded++;
      
      // Check file size as a sanity check
      const stats = fs.statSync(destPath);
      if (stats.size < 5000) {
        console.warn(`⚠️ Warning: Downloaded file is very small (${stats.size} bytes)`);
      }
      
      activeDownloads--;
      processQueue();
    });
    
    fileStream.on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete the file if there was an error
      console.error(`❌ Error saving file for card #${cardId}:`, err);
      results.failed++;
      
      activeDownloads--;
      processQueue();
    });
  });
  
  request.on('error', (err) => {
    console.error(`❌ Request error for card #${cardId}:`, err);
    
    if (retries > 0) {
      console.log(`Retrying for card #${cardId}...`);
      downloadFile(url, destPath, cardId, retries - 1);
    } else {
      results.failed++;
    }
    
    activeDownloads--;
    processQueue();
  });
  
  request.end();
}

function processQueue() {
  if (downloadQueue.length > 0 && activeDownloads < MAX_CONCURRENT) {
    const next = downloadQueue.shift();
    downloadFile(next.url, next.destPath, next.cardId, next.retries);
  } else if (activeDownloads === 0 && downloadQueue.length === 0) {
    // All downloads completed, show final results
    displayResults();
    updateCardData();
  }
}

function displayResults() {
  console.log(`\n📊 Download Results:`);
  console.log(`✅ Already existed: ${results.existing} files`);
  console.log(`✅ Successfully downloaded: ${results.downloaded} files`);
  console.log(`❌ Failed downloads: ${results.failed} files`);
  
  if (results.missing.length > 0) {
    console.log("\n🔍 Cards with missing remote URLs:");
    results.missing.forEach(item => {
      console.log(`  Card #${item.id} - ${item.targetWord}: No remote_target_img URL defined`);
    });
  }
}

function updateCardData() {
  // This function would update the card-data.js file with the new local paths
  // For simplicity, we're just reporting what would be updated
  
  console.log("\n🔄 Card data update:");
  
  if (results.downloaded > 0) {
    console.log(`${results.downloaded} cards would be updated with local file paths.`);
    console.log("To update card-data.js, run: node scripts/direct-download.js");
  } else {
    console.log("No updates needed for card-data.js.");
  }
}

// Main process - find missing files and download them
console.log(`🔍 Checking ${tabooCards.length} cards for missing images...`);

// First identify all missing files
tabooCards.forEach(card => {
  // Only check cards that have a valid remote_target_img
  if (!card.remote_target_img) {
    results.missing.push({
      id: card.id,
      targetWord: card.targetWord
    });
    return;
  }
  
  // Determine local path based on the card data
  const localPath = card.local_target_img || card.target_img;
  if (!localPath || !localPath.startsWith('images/')) {
    console.error(`⚠️ Card #${card.id} has invalid local path: ${localPath}`);
    return;
  }
  
  results.total++;
  const fullPath = path.join(__dirname, '..', localPath);
  
  if (fileExists(fullPath)) {
    // Check if file is too small (possible placeholder)
    const stats = fs.statSync(fullPath);
    if (stats.size < 5000) {
      console.log(`⚠️ Card #${card.id}: ${localPath} exists but is very small (${stats.size} bytes)`);
    } else {
      console.log(`✅ Already exists: ${localPath}`);
      results.existing++;
      return;
    }
  }
  
  // Prepare download
  const downloadUrl = getDirectDownloadUrl(card.remote_target_img);
  downloadFile(downloadUrl, fullPath, card.id);
});

// If no downloads were started, display results immediately
if (activeDownloads === 0) {
  displayResults();
}

// Handle any queued downloads
processQueue(); 