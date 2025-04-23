const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const path = require('path');

// Read the card data from the original file
const cardDataFile = fs.readFileSync('./js/card-data.js', 'utf8');

// Extract target words from the cardData
function extractTargetWordMap(content) {
  const targetWordMap = {};
  const regex = /id:\s*(\d+)[^]*?targetWord:\s*["'](.+?)["']/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const id = parseInt(match[1]);
    const targetWord = match[2];
    targetWordMap[id] = targetWord;
  }
  
  return targetWordMap;
}

// Check which images are already downloaded
function getDownloadedImages(dir) {
  if (!fs.existsSync(dir)) return [];
  
  const files = fs.readdirSync(dir);
  const downloadedCardIds = new Set();
  
  for (const file of files) {
    const match = file.match(/^(\d+)_target/);
    if (match) {
      downloadedCardIds.add(parseInt(match[1]));
    }
  }
  
  return downloadedCardIds;
}

// Get a list of missing images
function getMissingCardIds(allCardIds, downloadedCardIds) {
  return allCardIds.filter(id => !downloadedCardIds.has(id));
}

// Common request options with different user agents to try
function getRequestOptionsWithUserAgent(userAgentIndex = 0) {
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  ];
  
  return {
    headers: {
      'User-Agent': userAgents[userAgentIndex % userAgents.length],
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    timeout: 30000 // Longer timeout
  };
}

// Helper function to download a URL with retries and different user agents
async function downloadWithRetries(url, dest, cardId, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // If not first attempt, wait before retry with exponential backoff
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`⏱️ Waiting ${delay}ms before retry ${attempt+1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      console.log(`📥 Attempt ${attempt+1}/${maxRetries} for card ${cardId}`);
      
      const success = await new Promise((resolve) => {
        try {
          const parsedUrl = new URL(url);
          const client = parsedUrl.protocol === 'https:' ? https : http;
          
          const options = {
            ...getRequestOptionsWithUserAgent(attempt),
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search
          };
          
          const req = client.get(options, (res) => {
            // Handle redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              console.log(`⏩ Following redirect to ${res.headers.location}`);
              resolve(false); // Don't count redirects as a failure
              // We'll handle this in the main download function
              return;
            }
            
            if (res.statusCode < 200 || res.statusCode >= 300) {
              console.log(`❌ HTTP status: ${res.statusCode} for card ${cardId}`);
              resolve(false);
              return;
            }
            
            // Check content type to ensure it's an image
            const contentType = res.headers['content-type'] || '';
            if (!contentType.startsWith('image/')) {
              console.log(`❌ Not an image: ${contentType} for card ${cardId}`);
              resolve(false);
              return;
            }
            
            const fileStream = fs.createWriteStream(dest);
            res.pipe(fileStream);
            
            fileStream.on('finish', () => {
              fileStream.close();
              // Verify file size is reasonable
              const stats = fs.statSync(dest);
              if (stats.size < 100) { // Too small to be a valid image
                console.log(`❌ Downloaded file too small (${stats.size} bytes) for card ${cardId}`);
                fs.unlinkSync(dest);
                resolve(false);
                return;
              }
              
              console.log(`✅ Card ${cardId}: Downloaded image to ${dest} (${stats.size} bytes)`);
              resolve(true);
            });
            
            fileStream.on('error', (err) => {
              fs.unlink(dest, () => {});
              console.log(`❌ Error writing file: ${err.message} for card ${cardId}`);
              resolve(false);
            });
          });
          
          req.on('error', (err) => {
            console.log(`❌ Network error: ${err.message} for card ${cardId}`);
            resolve(false);
          });
          
          req.setTimeout(30000, () => {
            req.destroy();
            console.log(`❌ Request timeout for card ${cardId}`);
            resolve(false);
          });
          
          req.end();
        } catch (error) {
          console.log(`❌ Exception: ${error.message} for card ${cardId}`);
          resolve(false);
        }
      });
      
      if (success) return true;
      
    } catch (error) {
      console.log(`❌ Outer error: ${error.message} for card ${cardId}`);
    }
  }
  
  return false;
}

// Known working alternative URLs for specific problematic cards
// Based on our previous failures and manual research
const alternativeURLs = {
  8: [
    'https://media.sciencephoto.com/image/c0341593/800wm/C0341593-Lung_ultrasound,_M-mode_seashore_sign.jpg',
    'https://www.researchgate.net/profile/Luca-Saba-2/publication/328111272/figure/fig1/AS:680235089375232@1539200977100/Lung-ultrasonography-Time-motion-mode-showing-seashore-sign-of-normal-lung-Alternating.jpg'
  ],
  9: [
    'https://www.researchgate.net/profile/Luna-Gargani/publication/313350920/figure/fig1/AS:668380259504147@1536366520222/A-lines-are-horizontal-reverberation-artifacts-arising-from-the-pleural-line-at-regular.jpg',
    'https://i0.wp.com/www.researchgate.net/profile/Luna-Gargani/publication/313350920/figure/fig1/AS:668380259504147@1536366520222/A-lines-are-horizontal-reverberation-artifacts-arising-from-the-pleural-line-at-regular.jpg'
  ],
  12: [
    'https://www.researchgate.net/profile/Mohamed-Ismail-25/publication/342176345/figure/fig4/AS:903023310729219@1592353465018/Normal-aorta-on-transverse-view.png',
    'https://www.scielo.br/img/revistas/rb/v48n2/0100-3984-rb-48-02-0114-gf05.jpg'
  ],
  13: [
    'https://www.wikidoc.org/images/7/79/PSAX-AV.JPG',
    'https://www.researchgate.net/profile/Nilda-Espinola-Zavaleta/publication/331209956/figure/fig4/AS:731608061972483@1551438443430/Parasternal-short-axis-view-at-the-level-of-the-aortic-valve-showing-the-three-cusps.jpg'
  ],
  14: [
    'https://www.researchgate.net/profile/Jing-Ting-Liou/publication/281282326/figure/fig2/AS:391439266156545@1470343828354/Transverse-ultrasound-image-of-the-right-knee-popliteal-fossa-Note-that-the-popliteal.png',
    'https://ultrasoundcasestudies.files.wordpress.com/2017/05/nml-dvt.jpg'
  ],
  15: [
    'https://www.wikidoc.org/images/4/47/PSAX-MV.JPG',
    'https://www.researchgate.net/profile/Alessandro-Lobina/publication/257753396/figure/fig2/AS:392583973261315@1470613173356/The-fishmouth-shape-of-the-mitral-valve-in-parasagittal-view.png'
  ],
  16: [
    'https://www.researchgate.net/profile/De-Andres/publication/316910241/figure/fig1/AS:866177866801152@1583741767270/Parasagittal-ultrasound-view-of-the-brachial-plexus-A-Ultrasound-anatomy-of-the.png',
    'https://www.researchgate.net/profile/Araz-Pourmand/publication/340232725/figure/fig1/AS:870187272876032@1584562010135/Interscalene-block-approach-using-ultrasound-guidance-with-probe-orientation-and-needle.ppm'
  ],
  // Add more known alternatives for other cards...
};

// Map common Wikipedia image filename patterns
const wikipediaImageVariants = (filename) => {
  const base = path.basename(filename, path.extname(filename));
  const ext = path.extname(filename);
  
  return [
    filename,
    `${base.replace(/_/g, ' ')}${ext}`,
    `${base.replace(/ /g, '_')}${ext}`,
    `${base.replace(/%28/g, '(').replace(/%29/g, ')')}${ext}`,
    `${base.replace(/\(/g, '%28').replace(/\)/g, '%29')}${ext}`,
    // Add variants with different capitalization
    `${base.charAt(0).toUpperCase() + base.slice(1)}${ext}`
  ];
};

// Fetch from alternative URLs for a specific card
async function tryAlternativeURLs(cardId, dest, targetWord) {
  // 1. Try predefined alternative URLs if available
  if (alternativeURLs[cardId]) {
    for (const altUrl of alternativeURLs[cardId]) {
      console.log(`🔄 Trying predefined alternative URL for card ${cardId}: ${altUrl}`);
      const success = await downloadWithRetries(altUrl, dest, cardId, 3);
      if (success) return true;
    }
  }
  
  // 2. Try searching for similar images based on card target word
  // This would require an image search API (like Bing, Google, etc.)
  // Not implemented here
  
  return false;
}

// Process the Wikimedia Commons API more thoroughly
async function tryWikimediaAPI(url, dest, cardId) {
  if (!url.includes('wikipedia.org') && !url.includes('wikimedia.org')) {
    return false;
  }
  
  const parsedUrl = new URL(url);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const filename = path.basename(pathname);
  
  // Try multiple variants of the filename
  const filenameVariants = wikipediaImageVariants(filename);
  
  for (const variant of filenameVariants) {
    try {
      const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(variant)}&prop=imageinfo&iiprop=url&format=json`;
      console.log(`🔎 Trying Wikimedia API with variant: ${variant}`);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      const pages = data.query?.pages || {};
      const pageId = Object.keys(pages)[0];
      
      if (pageId && pageId !== '-1' && pages[pageId].imageinfo && pages[pageId].imageinfo.length > 0) {
        const directUrl = pages[pageId].imageinfo[0].url;
        console.log(`✅ Found Wikimedia image URL: ${directUrl}`);
        const success = await downloadWithRetries(directUrl, dest, cardId, 3);
        if (success) return true;
      }
    } catch (error) {
      console.log(`❌ Error with Wikimedia API for variant ${variant}: ${error.message}`);
    }
  }
  
  return false;
}

// Try downloading an image with all possible strategies
async function tryAllStrategies(cardId, url, targetWord, dest) {
  console.log(`\n🔄 Processing card ${cardId}: ${targetWord}`);
  
  // 1. Try direct download with the original URL
  if (await downloadWithRetries(url, dest, cardId)) {
    return true;
  }
  
  // 2. If it's a Wikipedia URL, try the API
  if (await tryWikimediaAPI(url, dest, cardId)) {
    return true;
  }
  
  // 3. Try alternative URLs for this specific card
  if (await tryAlternativeURLs(cardId, dest, targetWord)) {
    return true;
  }
  
  // 4. If all else fails, look for web.archive.org version
  const archiveUrl = `https://web.archive.org/web/0/${url}`;
  console.log(`🕰️ Trying web.archive.org: ${archiveUrl}`);
  if (await downloadWithRetries(archiveUrl, dest, cardId, 2)) {
    return true;
  }
  
  // All strategies failed
  console.log(`❌ All download strategies failed for card ${cardId}`);
  return false;
}

// Main function
async function downloadMissingImages() {
  const imagesDir = './images/cards/local';
  
  // Ensure the directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  // Extract information
  const targetWords = extractTargetWordMap(cardDataFile);
  const allCardIds = Object.keys(targetWords).map(id => parseInt(id));
  const downloadedImageIds = getDownloadedImages(imagesDir);
  const missingCardIds = getMissingCardIds(allCardIds, downloadedImageIds);
  
  console.log(`Found ${allCardIds.length} total cards`);
  console.log(`Already downloaded ${downloadedImageIds.size} images`);
  console.log(`Missing ${missingCardIds.length} images`);
  
  // Process missing images
  let successCount = 0;
  let failureCount = 0;
  const failedCards = [];
  
  for (const cardId of missingCardIds) {
    const cardMatch = cardDataFile.match(new RegExp(`id:\\s*${cardId},[\\s\\S]*?remote_target_img:\\s*["'](.+?)["']`));
    if (!cardMatch) {
      console.log(`❌ Could not find remote_target_img for card ${cardId}`);
      failedCards.push({ id: cardId, reason: 'No URL found in card data' });
      failureCount++;
      continue;
    }
    
    const url = cardMatch[1];
    const targetWord = targetWords[cardId] || `Card ${cardId}`;
    
    // Determine file extension
    let extension;
    try {
      const parsedUrl = new URL(url);
      extension = path.extname(parsedUrl.pathname) || '.jpg';
    } catch (e) {
      extension = '.jpg';
    }
    
    const dest = path.join(imagesDir, `${cardId}_target${extension}`);
    
    const success = await tryAllStrategies(cardId, url, targetWord, dest);
    
    if (success) {
      successCount++;
    } else {
      failureCount++;
      failedCards.push({ id: cardId, url, targetWord });
    }
  }
  
  // Generate report
  console.log('\n=== Download Report ===');
  console.log(`Successfully downloaded: ${successCount} images`);
  console.log(`Failed to download: ${failureCount} images`);
  
  if (failedCards.length > 0) {
    console.log('\nFailed cards:');
    failedCards.forEach(card => {
      console.log(`Card ${card.id}: ${card.targetWord}`);
    });
    
    // Write failed cards to a JSON file for later processing
    fs.writeFileSync('failed-images.json', JSON.stringify(failedCards, null, 2));
    console.log('\nWrote details to failed-images.json');
  }
  
  if (successCount > 0) {
    console.log('\n✅ Successfully downloaded additional images!');
  }
}

// Polyfill for fetch
function fetch(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      ...getRequestOptionsWithUserAgent(0),
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search
    };
    
    const req = client.get(options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`Status Code: ${res.statusCode}`));
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data)
          });
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Run the script
downloadMissingImages().catch(console.error); 