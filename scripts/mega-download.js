/**
 * MEGA Image Downloader
 * 
 * Combines multiple download strategies to maximize success rates
 * 1. Direct fetch with enhanced headers
 * 2. Custom built Wikimedia API image fetch
 * 3. Multiple proxy approaches
 * 4. Child process curl with specific parameters
 * 5. With exponential backoff retries
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const https = require('https');

// Check for node-fetch
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  console.error('Please install node-fetch first:');
  console.error('npm install node-fetch@2');
  process.exit(1);
}

// Target image IDs from verification script (broken images)
const TARGET_CARD_IDS = [2, 8, 10, 11, 14, 16, 19, 20, 21, 22, 23, 29, 31, 33, 34, 35];

// Configuration
const CONFIG = {
  maxRetries: 5,
  delayBetweenAttempts: 1000,
  concurrentDownloads: 1, // Conservative to avoid rate limiting
  minFileSizeBytes: 5000,
  timeoutMs: 30000,
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
  ]
};

// Setup paths
const localPath = 'images/cards/local';
const defaultsPath = 'images/cards/defaults';
const placeholderPath = path.join(__dirname, '../images/cards/placeholder.svg');

[localPath, defaultsPath].forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Image data from the table (just the ones we need)
const cardsData = [
  {id: 2, prompt: "Trauma: LUQ view—spleen–kidney interface.", tabooWords: ["LUQ", "Spleen", "Kidney", "FAST"], url: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Splenorenal_recess_ultrasound.png"},
  {id: 8, prompt: "M‑mode \"barcode\" sign.", tabooWords: ["Pneumothorax", "Sliding", "Pleura"], url: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Barcode_sign_M_mode_pneumothorax.png"},
  {id: 10, prompt: "Pleural effusion—\"jelly‑fish\" lung.", tabooWords: ["Effusion", "Fluid", "Chest"], url: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Pleural_effusion_with_jellyfish_sign.png"},
  {id: 11, prompt: "Lung consolidation with air bronchograms.", tabooWords: ["Consolidation", "Bronchogram", "Pneumonia"], url: "https://upload.wikimedia.org/wikipedia/commons/2/25/Lung_ultrasound_pneumonia_consolidation.png"},
  {id: 14, prompt: "Popliteal vein DVT (long axis).", tabooWords: ["Popliteal", "DVT", "Thrombus"], url: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Popliteal_vein_thrombosis_ultrasound.jpg"},
  {id: 16, prompt: "Interscalene block: plexus roots between scalenes.", tabooWords: ["Interscalene", "Plexus", "Roots"], url: "https://upload.wikimedia.org/wikipedia/commons/8/89/Brachial_plexus_ultrasound_C5_C6_roots.png"},
  {id: 19, prompt: "Soft‑tissue abscess with posterior enhancement.", tabooWords: ["Abscess", "Pus", "Cellulitis"], url: "https://upload.wikimedia.org/wikipedia/commons/8/89/Soft_tissue_abscess_ultrasound.png"},
  {id: 20, prompt: "Early intra‑uterine pregnancy (gestational sac + yolk).", tabooWords: ["Pregnancy", "Gestational", "Uterus"], url: "https://upload.wikimedia.org/wikipedia/commons/5/59/Ultrasound_gestational_sac.png"},
  {id: 21, prompt: "Ectopic: empty uterus & pelvic fluid.", tabooWords: ["Ectopic", "Tubal", "Rupture"], url: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Ectopic_pregnancy_ultrasound.png"},
  {id: 22, prompt: "Retinal detachment—flapping membrane.", tabooWords: ["Retina", "Detach", "Eye"], url: "https://upload.wikimedia.org/wikipedia/commons/1/19/Retinal_detachment_ultrasound.jpg"},
  {id: 23, prompt: "Optic‑nerve sheath > 5 mm (ICP).", tabooWords: ["Optic", "Sheath", "Pressure"], url: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Optic_nerve_sheath_dilation_ultrasound.png"},
  {id: 29, prompt: "In‑plane needle visualised to target.", tabooWords: ["Needle", "Guide", "Echogenic"], url: "https://upload.wikimedia.org/wikipedia/commons/3/3e/In_plane_needle_ultrasound.png"},
  {id: 31, prompt: "Popliteal sciatic bifurcation for block.", tabooWords: ["Sciatic", "Popliteal", "Block"], url: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Popliteal_sciatic_ultrasound.png"},
  {id: 33, prompt: "Apical 4‑chamber: RV dilation in PE.", tabooWords: ["McConnell", "PE", "RV"], url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/A4C_RV_dilation.png"},
  {id: 34, prompt: "RUSH exam diagram—pump, tank, pipes.", tabooWords: ["RUSH", "Shock", "Protocol"], url: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Focused_cardiac_ultrasound_views.svg"},
  {id: 35, prompt: "Lung point (transition of sliding).", tabooWords: ["Lung", "Point", "Sliding"], url: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Lung_point_static_ultrasound.png"}
];

// Alternative URLs to try for problematic images
const alternativeUrls = {
  8: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Barcode_sign_M_mode_pneumothorax.png?width=800",
  10: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Pleural_effusion_with_jellyfish_sign.png?width=800",
  11: "https://radiopaedia.org/cases/lung-ultrasound-pneumonia-consolidation",
  14: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Popliteal_vein_thrombosis_ultrasound.jpg?width=800",
  16: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Brachial_plexus_ultrasound_C5_C6_roots.png?width=800",
  19: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Soft_tissue_abscess_ultrasound.png?width=800",
  20: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ultrasound_gestational_sac.png?width=800",
  21: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Ectopic_pregnancy_ultrasound.png?width=800",
  22: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Retinal_detachment_ultrasound.jpg?width=800",
  23: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Optic_nerve_sheath_dilation_ultrasound.png?width=800",
  29: "https://commons.wikimedia.org/wiki/Special:Redirect/file/In_plane_needle_ultrasound.png?width=800",
  31: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Popliteal_sciatic_ultrasound.png?width=800",
  33: "https://commons.wikimedia.org/wiki/Special:Redirect/file/A4C_RV_dilation.png?width=800",
  34: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Focused_cardiac_ultrasound_views.svg?width=800",
  35: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Lung_point_static_ultrasound.png?width=800"
};

// Import card data
const cardDataPath = path.join(__dirname, '../js/card-data.js');
const cardDataContent = fs.readFileSync(cardDataPath, 'utf8');
const tabooCardsMatch = cardDataContent.match(/const tabooCards = (\[[\s\S]*?\]);/);

if (!tabooCardsMatch) {
  console.error('Could not parse tabooCards from card-data.js');
  process.exit(1);
}

// Evaluate the array content
const tabooCards = eval(tabooCardsMatch[1]);
console.log(`Found ${tabooCards.length} cards in card-data.js`);
console.log(`Targeting ${TARGET_CARD_IDS.length} cards for image download\n`);

// Queue for throttling requests
let activeDownloads = 0;
const downloadQueue = [];

// Process the download queue
function processQueue() {
  if (downloadQueue.length === 0 || activeDownloads >= CONFIG.concurrentDownloads) {
    return;
  }

  const nextDownload = downloadQueue.shift();
  activeDownloads++;

  setTimeout(() => {
    nextDownload().then(() => {
      activeDownloads--;
      processQueue();
    }).catch(() => {
      activeDownloads--;
      processQueue();
    });
  }, CONFIG.delayBetweenAttempts);
}

// Helper: Get random user agent
function getRandomUserAgent() {
  return CONFIG.userAgents[Math.floor(Math.random() * CONFIG.userAgents.length)];
}

// Helper: Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: Generate Wikimedia API URLs
function getWikimediaUrls(originalUrl) {
  const urlObj = new URL(originalUrl);
  const filename = decodeURIComponent(urlObj.pathname.split('/').pop());
  
  return {
    // Special FilePath URL for direct downloads
    filePath: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=1200`,
    
    // Redirect URL for thumbnails
    redirect: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}?width=1200`,
    
    // API URL to get image info
    api: `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`,
    
    // Thumb URL for smaller version
    thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/${filename.charAt(0).toLowerCase()}/${filename.slice(0, 2).toLowerCase()}/${filename}/800px-${filename}`,
    
    // Proxy URLs
    weservProxy: `https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/${urlObj.pathname.substring(1)}&default=placeholder&output=jpg`,
    
    // Google cache proxy
    googleCache: `https://webcache.googleusercontent.com/search?q=cache:${originalUrl}`
  };
}

// Strategy 1: Download with fetch
async function downloadWithFetch(url, savePath, attemptCount = 0) {
  try {
    // Add cache buster
    const cacheBuster = `?cache=${Date.now()}`;
    const fullUrl = url.includes('?') ? `${url}&cache=${Date.now()}` : `${url}${cacheBuster}`;
    
    console.log(`[Fetch] Attempt ${attemptCount+1}: ${url}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://commons.wikimedia.org/',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: CONFIG.timeoutMs,
      follow: 10 // Follow up to 10 redirects
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = await response.buffer();
    
    // Check if we received actual content
    if (buffer.length < CONFIG.minFileSizeBytes) {
      throw new Error(`Downloaded file too small (${buffer.length} bytes)`);
    }
    
    fs.writeFileSync(savePath, buffer);
    console.log(`✅ [Fetch] Success: ${savePath} (${(buffer.length / 1024).toFixed(2)} KB)`);
    return true;
  } catch (error) {
    console.error(`❌ [Fetch] Error: ${error.message}`);
    
    // Implement exponential backoff for retries
    if (attemptCount < CONFIG.maxRetries) {
      const delay = Math.pow(2, attemptCount) * 1000;
      console.log(`⏱️ Retrying in ${delay/1000}s...`);
      await sleep(delay);
      return downloadWithFetch(url, savePath, attemptCount + 1);
    }
    
    return false;
  }
}

// Strategy 2: Download using Node's native HTTPS
function downloadWithHttps(url, savePath) {
  return new Promise((resolve) => {
    console.log(`[HTTPS] Downloading: ${url}`);
    
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://commons.wikimedia.org/'
      },
      timeout: CONFIG.timeoutMs
    };
    
    const req = https.request(options, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`↪️ [HTTPS] Redirect to: ${res.headers.location}`);
        downloadWithHttps(res.headers.location, savePath).then(resolve);
        return;
      }
      
      if (res.statusCode !== 200) {
        console.error(`❌ [HTTPS] Failed: ${res.statusCode}`);
        resolve(false);
        return;
      }
      
      // Create file write stream
      const file = fs.createWriteStream(savePath);
      
      // Pipe response to file
      res.pipe(file);
      
      // Handle file completion
      file.on('finish', () => {
        file.close();
        
        // Verify file size
        const stats = fs.statSync(savePath);
        if (stats.size < CONFIG.minFileSizeBytes) {
          console.error(`❌ [HTTPS] File too small: ${stats.size} bytes`);
          resolve(false);
          return;
        }
        
        console.log(`✅ [HTTPS] Success: ${savePath} (${(stats.size / 1024).toFixed(2)} KB)`);
        resolve(true);
      });
      
      // Handle errors
      file.on('error', (err) => {
        fs.unlink(savePath, () => {});
        console.error(`❌ [HTTPS] File error: ${err.message}`);
        resolve(false);
      });
    });
    
    req.on('error', (err) => {
      console.error(`❌ [HTTPS] Request error: ${err.message}`);
      resolve(false);
    });
    
    // Set timeout
    req.setTimeout(CONFIG.timeoutMs, () => {
      req.destroy(new Error('Request timed out'));
      resolve(false);
    });
    
    req.end();
  });
}

// Strategy 3: Use curl for downloading
function downloadWithCurl(url, savePath) {
  return new Promise((resolve) => {
    // Escape quotes in URL for shell safety
    const escapedUrl = url.replace(/'/g, "'\\''");
    
    // Create curl command with proper headers and redirects
    const curlCommand = `curl -s -L -o "${savePath}" ` +
                      `--connect-timeout 15 ` +
                      `--max-time 30 ` +
                      `--retry 3 ` +
                      `--retry-delay 2 ` +
                      `-A "${getRandomUserAgent()}" ` +
                      `-H "Referer: https://commons.wikimedia.org/" ` +
                      `-H "Accept: image/webp,image/apng,image/*,*/*;q=0.8" ` +
                      `'${escapedUrl}'`;
    
    console.log(`[Curl] Downloading: ${url}`);
    
    // Execute curl command
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ [Curl] Error: ${error.message}`);
        resolve(false);
        return;
      }
      
      // Check if file was created with sufficient size
      if (fs.existsSync(savePath)) {
        const stats = fs.statSync(savePath);
        if (stats.size < CONFIG.minFileSizeBytes) {
          console.error(`❌ [Curl] File too small: ${stats.size} bytes`);
          fs.unlinkSync(savePath);
          resolve(false);
          return;
        } else {
          console.log(`✅ [Curl] Success: ${savePath} (${(stats.size / 1024).toFixed(2)} KB)`);
          resolve(true);
          return;
        }
      }
      
      console.error('❌ [Curl] File not created');
      resolve(false);
    });
  });
}

// Strategy 4: Try to get Wikimedia API URL and download
async function downloadWithWikimediaAPI(url, savePath) {
  try {
    const urlObj = new URL(url);
    const filename = decodeURIComponent(urlObj.pathname.split('/').pop());
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
    
    console.log(`[API] Fetching info from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': getRandomUserAgent() }
    });
    
    if (!response.ok) {
      throw new Error(`API HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.query || !data.query.pages) {
      throw new Error('Invalid API response');
    }
    
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (pageId === '-1' || !pages[pageId].imageinfo || !pages[pageId].imageinfo[0]) {
      throw new Error('Image info not found in API');
    }
    
    const imageUrl = pages[pageId].imageinfo[0].url;
    console.log(`🔍 [API] Found URL: ${imageUrl}`);
    
    // Now download using the URL from API
    return await downloadWithFetch(imageUrl, savePath);
    
  } catch (error) {
    console.error(`❌ [API] Error: ${error.message}`);
    return false;
  }
}

// Main download function
async function downloadImage(card) {
  const cardId = card.id;
  const originalUrl = card.url;
  
  // Prepare filenames and paths
  const urlObj = new URL(originalUrl);
  const filename = decodeURIComponent(urlObj.pathname.split('/').pop());
  const safeFilename = `${cardId}_target_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  
  // Paths to save images
  const localSavePath = path.join(__dirname, '..', localPath, safeFilename);
  const defaultSavePath = path.join(__dirname, '..', defaultsPath, `ultrasound_${cardId}.png`);
  
  // Local path relative to web root (for updating card data)
  const localPathRelative = `${localPath}/${safeFilename}`;
  const defaultPathRelative = `${defaultsPath}/ultrasound_${cardId}.png`;
  
  // Generate all possible URLs to try
  const wikimediaUrls = getWikimediaUrls(originalUrl);
  
  // If file already exists with sufficient size, skip
  if (fs.existsSync(localSavePath)) {
    const stats = fs.statSync(localSavePath);
    if (stats.size > CONFIG.minFileSizeBytes) {
      console.log(`✅ Already exists: ${localSavePath}`);
      
      // Update card data
      updateCardData(cardId, localPathRelative);
      return true;
    } else {
      console.log(`⚠️ Existing file too small, redownloading: ${localSavePath}`);
    }
  }
  
  console.log(`\n🔍 Processing Card ${cardId}: ${card.prompt}`);
  
  // Try all download strategies in sequence
  
  // 1. Try direct fetch
  let success = await downloadWithFetch(originalUrl, localSavePath);
  if (success) {
    updateCardData(cardId, localPathRelative);
    return true;
  }
  
  // 2. Try alternative URL if available
  if (alternativeUrls[cardId]) {
    console.log(`🔍 Trying alternative URL: ${alternativeUrls[cardId]}`);
    success = await downloadWithFetch(alternativeUrls[cardId], localSavePath);
    if (success) {
      updateCardData(cardId, localPathRelative);
      return true;
    }
  }
  
  // 3. Try Wikimedia FilePath URL
  console.log(`🔍 Trying Wikimedia FilePath: ${wikimediaUrls.filePath}`);
  success = await downloadWithFetch(wikimediaUrls.filePath, localSavePath);
  if (success) {
    updateCardData(cardId, localPathRelative);
    return true;
  }
  
  // 4. Try Wikimedia Redirect URL
  console.log(`🔍 Trying Wikimedia Redirect: ${wikimediaUrls.redirect}`);
  success = await downloadWithFetch(wikimediaUrls.redirect, localSavePath);
  if (success) {
    updateCardData(cardId, localPathRelative);
    return true;
  }
  
  // 5. Try API lookup
  success = await downloadWithWikimediaAPI(originalUrl, localSavePath);
  if (success) {
    updateCardData(cardId, localPathRelative);
    return true;
  }
  
  // 6. Try Weserv proxy
  console.log(`🔍 Trying Weserv Proxy: ${wikimediaUrls.weservProxy}`);
  success = await downloadWithFetch(wikimediaUrls.weservProxy, localSavePath);
  if (success) {
    updateCardData(cardId, localPathRelative);
    return true;
  }
  
  // 7. Try native HTTPS module
  success = await downloadWithHttps(originalUrl, localSavePath);
  if (success) {
    updateCardData(cardId, localPathRelative);
    return true;
  }
  
  // 8. Try curl as last resort
  success = await downloadWithCurl(originalUrl, localSavePath);
  if (success) {
    updateCardData(cardId, localPathRelative);
    return true;
  }
  
  // Try curl on other URLs
  console.log(`🔍 Trying Curl with FilePath: ${wikimediaUrls.filePath}`);
  success = await downloadWithCurl(wikimediaUrls.filePath, localSavePath);
  if (success) {
    updateCardData(cardId, localPathRelative);
    return true;
  }
  
  // If all download methods failed, use placeholder
  console.log(`❌ All download methods failed for Card ${cardId}`);
  
  // Ensure we have a placeholder image
  if (fs.existsSync(placeholderPath)) {
    if (!fs.existsSync(defaultSavePath)) {
      fs.copyFileSync(placeholderPath, defaultSavePath);
      console.log(`⚠️ Created placeholder: ${defaultSavePath}`);
    }
    
    // Update card to point to placeholder
    updateCardData(cardId, defaultPathRelative);
    
    console.log(`⚠️ Card ${cardId} now using placeholder image`);
    return false;
  } else {
    console.error(`❌ Placeholder image not found at ${placeholderPath}`);
    return false;
  }
}

// Update card data with new image path
function updateCardData(cardId, imagePath) {
  const card = tabooCards.find(c => c.id === cardId);
  if (!card) {
    console.error(`Card ID ${cardId} not found in card data`);
    return;
  }
  
  card.target_img = imagePath;
  card.local_target_img = imagePath;
  
  console.log(`✏️ Updated card ${cardId} to use image: ${imagePath}`);
}

// Save updated card data
function saveCardData() {
  console.log('\nUpdating card-data.js...');
  
  let updatedCardData = cardDataContent.replace(
    /const tabooCards = \[[\s\S]*?\];/, 
    `const tabooCards = ${JSON.stringify(tabooCards, null, 4)};`
  );
  
  fs.writeFileSync(cardDataPath, updatedCardData, 'utf8');
  console.log(`✅ Updated card data saved to ${cardDataPath}`);
}

// Main function
async function main() {
  console.log('🚀 Starting MEGA image downloader...');
  console.log(`🎯 Targeting ${TARGET_CARD_IDS.length} cards for download\n`);
  
  // Filter card data to only include target IDs
  const targetCards = cardsData.filter(card => TARGET_CARD_IDS.includes(card.id));
  
  // Process each card
  let successes = 0;
  let failures = 0;
  
  for (const card of targetCards) {
    const success = await downloadImage(card);
    if (success) {
      successes++;
    } else {
      failures++;
    }
    
    // Add a slight delay between cards to avoid rate limiting
    await sleep(CONFIG.delayBetweenAttempts);
  }
  
  // Save the updated card data
  saveCardData();
  
  // Report results
  console.log('\n--- RESULTS ---');
  console.log(`Total cards: ${targetCards.length}`);
  console.log(`Successfully downloaded: ${successes}`);
  console.log(`Failed downloads (using placeholders): ${failures}`);
  
  console.log('\nDone! 🎉');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 