#!/usr/bin/env node
/**
 * Complete image downloader for all Taboo cards
 * Uses Wikimedia's Special:FilePath endpoint to avoid 403 errors
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Configuration
const CONFIG = {
  cardDataPath: path.join(__dirname, '../js/card-data.js'),
  localImagesDir: path.join(__dirname, '../images/cards/local'),
  minImageSize: 5000, // Bytes
  concurrentDownloads: 2
};

// Ensure image directory exists
if (!fs.existsSync(CONFIG.localImagesDir)) {
  fs.mkdirSync(CONFIG.localImagesDir, { recursive: true });
}

// Load card data
let cardDataContent = fs.readFileSync(CONFIG.cardDataPath, 'utf8');
const tabooCardsMatch = cardDataContent.match(/const tabooCards = (\[[\s\S]*?\]);/);
if (!tabooCardsMatch) {
  console.error('Could not parse tabooCards from card-data.js');
  process.exit(1);
}

// Parse the cards array
const tabooCards = eval(tabooCardsMatch[1]);
console.log(`Found ${tabooCards.length} cards in card-data.js`);

// Convert a Wikimedia URL to Special:FilePath for reliable downloads
function getCandidateUrls(remoteUrl) {
  const candidates = [];
  if (!remoteUrl) return candidates;
  candidates.push(remoteUrl);

  // If remoteUrl is a Wikimedia thumb, derive original URL
  if (remoteUrl.includes('upload.wikimedia.org') && remoteUrl.includes('/thumb/')) {
    try {
      const parts = remoteUrl.split('/');
      // find index of 'thumb'
      const idx = parts.indexOf('thumb');
      if (idx !== -1 && parts.length > idx + 3) {
        // original filename is after thumb/<first>/<second>/<filename>
        const filename = parts[idx + 3];
        const originalBase = parts.slice(0, idx).join('/');
        const origUrl = `${originalBase}/${filename}`;
        candidates.push(origUrl);
      }
    } catch (_) {}
  }

  // Add Special:FilePath variant
  try {
    const urlObj = new URL(remoteUrl);
    const filename = decodeURIComponent(urlObj.pathname.split('/').pop());
    const filePathUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=1200`;
    candidates.push(filePathUrl);
  } catch (_) {}

  // Add weserv proxy
  candidates.push(`https://images.weserv.nl/?url=${encodeURIComponent(remoteUrl)}&n=-1`);
  return [...new Set(candidates)];
}

// Download an image with proper headers
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://commons.wikimedia.org/'
      }
    };
    
    const req = https.request(options, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`↪️ Redirect to: ${res.headers.location}`);
        downloadImage(res.headers.location, filepath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP error ${res.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(filepath);
        if (stats.size < CONFIG.minImageSize) {
          fs.unlinkSync(filepath);
          reject(new Error(`Downloaded file too small: ${stats.size} bytes`));
        } else {
          resolve(stats.size);
        }
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Process all cards
async function processAllCards() {
  console.log("Starting download of all card images...");
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  };
  
  // Process cards one by one
  for (const card of tabooCards) {
    try {
      if (!card.remote_target_img) {
        console.log(`⚠️ Card ${card.id} has no remote_target_img URL`);
        results.skipped++;
        continue;
      }
      
      // Prepare filenames
      const remoteUrl = card.remote_target_img;
      const filename = remoteUrl.split('/').pop().replace(/[^a-zA-Z0-9.-]/g, '_');
      const localFilename = `${card.id}_target_${filename}`;
      const localImagePath = path.join(CONFIG.localImagesDir, localFilename);
      const localWebPath = `images/cards/local/${localFilename}`;
      
      console.log(`\nProcessing card ${card.id}: ${card.targetWord}`);
      
      // Check if file already exists and is large enough
      if (fs.existsSync(localImagePath)) {
        const stats = fs.statSync(localImagePath);
        if (stats.size >= CONFIG.minImageSize) {
          console.log(`✅ File already exists: ${localFilename} (${formatSize(stats.size)})`);
          
          // Make sure card data points to this file
          card.target_img = localWebPath;
          card.local_target_img = localWebPath;
          
          results.success++;
          continue;
        } else {
          console.log(`⚠️ Existing file too small (${formatSize(stats.size)}), redownloading...`);
          fs.unlinkSync(localImagePath);
        }
      }
      
      // Build candidate URLs
      const candidateUrls = getCandidateUrls(remoteUrl);
      let downloaded = false;
      for (const url of candidateUrls) {
        console.log(`   ↪️ Trying ${url}`);
        try {
          const fileSize = await downloadImage(url, localImagePath);
          console.log(`✅ Downloaded from ${url} (${formatSize(fileSize)})`);
          downloaded = true;
          break;
        } catch (err) {
          console.warn(`   ❌ ${err.message}`);
        }
      }
      if (!downloaded) {
        console.error(`❌ Could not download any URL for card ${card.id}`);
        results.failed++;
        continue;
      }
      
      // Update card data
      card.target_img = localWebPath;
      card.local_target_img = localWebPath;
      
      results.success++;
    } catch (error) {
      console.error(`❌ Failed to process card ${card.id}: ${error.message}`);
      results.failed++;
    }
  }
  
  // Save updated card data
  console.log("\nSaving updated card data...");
  const updatedContent = cardDataContent.replace(
    /const tabooCards = \[[\s\S]*?\];/,
    `const tabooCards = ${JSON.stringify(tabooCards, null, 2)};`
  );
  
  fs.writeFileSync(CONFIG.cardDataPath, updatedContent, 'utf8');
  console.log(`✅ Updated card data saved to ${CONFIG.cardDataPath}`);
  
  // Final report
  console.log("\n=== RESULTS ===");
  console.log(`Total cards: ${tabooCards.length}`);
  console.log(`✅ Success: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️ Skipped: ${results.skipped}`);
}

// Helper: Format file size
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Run the main function
processAllCards().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
}); 