#!/usr/bin/env node
/**
 * google-image-finder.js
 * 
 * Fetches ultrasound images from Google Images for cards that are missing
 * appropriate images. Uses puppeteer to perform the searches and extract
 * image URLs directly from Google's image search results.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const puppeteer = require('puppeteer');

// --- configuration ---------------------------------------------------------
const CONFIG = {
  cardDataPath: path.join(__dirname,'../js/card-data.js'),
  imgDir: path.join(__dirname,'../images/cards/local'),
  minSize: 3000,          // bytes – smaller considered broken
  throttleMs: 2000,       // delay between searches to avoid rate limiting
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  skipSuccessful: true,   // skip cards that already have local images
  specificCards: [2, 4, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35],  // process only missing cards
  maxRetries: 3,          // max number of search term variations to try
};

const DEBUG = true; // Enable debug mode

// --- hardcoded URLs for problematic cards ----------------------------------
const HARDCODED_URLS = {
  2: "https://images.radiopaedia.org/images/28113232/a4cea06367a64c0319b17fe1ca26f0_big_gallery.jpeg", // Splenorenal Recess View
  4: "https://images.radiopaedia.org/images/54895892/54249ce36cf30597357183dfc55f63_gallery.jpeg", // Subxiphoid Cardiac View
  8: "https://www.ultrasoundcases.info/uploads/images/Gallery%20Images/Chest/pneumothorax/pneumothorax-m-mode-seashore-sign.jpg", // M-mode Seashore Sign
  13: "https://images.radiopaedia.org/images/22057313/28fc96ceb74f21f39b59d1dbc00f5a_big_gallery.jpeg", // Parasternal Short Axis (Aortic)
  14: "https://www.ultrasoundcases.info/uploads/images/Gallery%20Images/Vascular/dvt-popliteal-vein/dvt-popliteal-vein-6.jpg", // Popliteal Vessels
  15: "https://images.radiopaedia.org/images/142089983/414feb1ba7eb28000ea1c31f8518e2_big_gallery.jpeg", // PSAX Mitral Valve
  16: "https://images.radiopaedia.org/images/10654893/8c2a8dd14a42281af37b3f9cfbe1a9_big_gallery.jpeg", // Brachial Plexus
  23: "https://images.radiopaedia.org/images/45869/b3b0acf2b45bb9b8eda2d4e4eaabe9_big_gallery.jpeg", // Apical Two Chamber
  26: "https://images.radiopaedia.org/images/656564/332ca60a7e1d5f9e1bdd4ef54fb05a_big_gallery.jpeg", // Internal Jugular Vein
  30: "https://images.radiopaedia.org/images/2279259/36e7c9bfe0a9d4c5c5e0a82f7c6bb7_big_gallery.jpeg", // Spleen Long Axis
};

// --- medical search terms to try -------------------------------------------
function buildSearchVariations(card) {
  const result = [];
  
  // Base search terms
  result.push(`${card.targetWord} ultrasound`);
  result.push(`${card.targetWord} ultrasound sonogram medical`);
  
  // Add terms with taboo words (which are anatomy/technical terms)
  if (card.tabooWords && card.tabooWords.length > 0) {
    result.push(`${card.targetWord} ${card.tabooWords.slice(0, 2).join(' ')} ultrasound`);
    result.push(`${card.tabooWords.slice(0, 3).join(' ')} medical ultrasound image`);
  }
  
  // Add specialized medical imaging terms
  result.push(`${card.targetWord} radiology ultrasound medical imaging`);
  
  return result;
}

// --- tiny helper functions -------------------------------------------------
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function fmt(bytes){return bytes<1024?`${bytes} B`:bytes<1048576?`${(bytes/1024).toFixed(1)} KB`:`${(bytes/1048576).toFixed(1)} MB`;}
function debug(msg) {
  if (DEBUG) console.log(`[DEBUG] ${msg}`);
}

// --- load card data --------------------------------------------------------
if(!fs.existsSync(CONFIG.imgDir)) fs.mkdirSync(CONFIG.imgDir,{recursive:true});
const jsText = fs.readFileSync(CONFIG.cardDataPath,'utf8');
const match = jsText.match(/const\s+tabooCards\s*=\s*(\[[\s\S]*?\]);/);
if(!match){console.error('❌ Could not parse tabooCards');process.exit(1);} 
const cards = eval(match[1]);

// --- filter cards to process -----------------------------------------------
const cardsToProcess = CONFIG.specificCards 
  ? cards.filter(c => CONFIG.specificCards.includes(c.id))
  : cards;

// --- download an image from URL --------------------------------------------
function download(url, dest){
  return new Promise((resolve,reject)=>{
    https.get(url, {
      headers:{
        'User-Agent': CONFIG.userAgent,
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
      }
    }, res=>{
      if(res.statusCode>=300 && res.statusCode<400 && res.headers.location){
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if(res.statusCode!==200) return reject(new Error(`HTTP ${res.statusCode}`));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish',()=>{
        file.close();
        const s = fs.statSync(dest).size;
        if(s < CONFIG.minSize){
          fs.unlinkSync(dest);
          return reject(new Error('too small'));
        }
        resolve(s);
      });
    }).on('error',reject);
  });
}

// --- get Google Images URLs for a search term ------------------------------
async function getGoogleImageUrls(searchTerm, maxResults = 10) {
  console.log(`   🔎 Searching Google Images for: "${searchTerm}"`);
  let browser = null;
  
  try {
    debug("Launching browser...");
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    debug("Opening new page...");
    const page = await browser.newPage();
    
    // Improved stealth settings
    debug("Setting user agent and headers...");
    await page.setUserAgent(CONFIG.userAgent);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });
    
    // Evasion scripts
    debug("Setting up evasion scripts...");
    await page.evaluateOnNewDocument(() => {
      // Pass webdriver test
      Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
      
      // Pass chrome test
      window.chrome = {
        runtime: {}
      };
      
      // Pass permissions test
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({state: Notification.permission}) :
          originalQuery(parameters)
      );
      
      // Fake plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });
    
    // Navigate to Google Images search with randomized parameters to avoid detection
    const timestamp = Date.now();
    const encodedSearch = encodeURIComponent(searchTerm);
    debug(`Navigating to Google Images search for: ${searchTerm}`);
    await page.goto(`https://www.google.com/search?q=${encodedSearch}&tbm=isch&tbs=isz:l&ijn=0&source=lnms&sa=X&ved=${timestamp}`, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Add small random delays for human-like behavior
    debug("Adding human-like delays and behaviors...");
    // Use sleep instead of waitForTimeout
    await sleep(1000 + Math.random() * 1000);
    await page.mouse.move(50 + Math.random() * 500, 50 + Math.random() * 500);
    
    // Random scrolling to simulate human behavior
    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
      await page.mouse.wheel({deltaY: 300 + Math.random() * 600});
      await sleep(500 + Math.random() * 1000);
    }
    
    // Extract image URLs from the page
    debug("Extracting image URLs...");
    const imageUrls = await page.evaluate(() => {
      const urls = [];
      // Get all image elements
      const imgElements = document.querySelectorAll('img');
      
      // Skip the first few (Google UI elements)
      for (let i = 3; i < imgElements.length && urls.length < 50; i++) {
        const img = imgElements[i];
        if (img.src && img.src.startsWith('http') && img.width > 100) {
          urls.push(img.src);
        }
      }
      
      // Also try to get the full-size image URLs (more important)
      const anchors = document.querySelectorAll('a');
      for (const a of anchors) {
        if (a.href && a.href.includes('/imgres?imgurl=')) {
          try {
            const fullUrl = new URL(a.href).searchParams.get('imgurl');
            if (fullUrl && !urls.includes(fullUrl) && 
                (fullUrl.endsWith('.jpg') || fullUrl.endsWith('.jpeg') || 
                 fullUrl.endsWith('.png') || fullUrl.endsWith('.gif'))) {
              urls.push(fullUrl);
            }
          } catch (e) {
            // Try alternate parsing method if URLSearchParams fails
            try {
              const urlMatch = a.href.match(/imgurl=([^&]+)/);
              if (urlMatch && urlMatch[1]) {
                const fullUrl = decodeURIComponent(urlMatch[1]);
                if (fullUrl && !urls.includes(fullUrl)) {
                  urls.push(fullUrl);
                }
              }
            } catch (e2) {/* ignore parsing errors */}
          }
        }
      }
      
      return urls;
    });
    
    debug(`Found ${imageUrls.length} image URLs`);
    return imageUrls.slice(0, maxResults);
  } catch (err) {
    console.error(`   ⚠️ Browser error: ${err.message}`);
    if (err.stack) debug(err.stack);
    return []; // Return empty array instead of throwing
  } finally {
    if (browser) {
      debug("Closing browser...");
      await browser.close();
    }
  }
}

// --- main function ---------------------------------------------------------
(async () => {
  let successful = 0, failed = 0, skipped = 0;
  
  console.log(`Processing ${cardsToProcess.length} cards...`);
  
  for (const card of cardsToProcess) {
    const id = card.id;
    const localName = `${id}_target_${card.targetWord.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
    const localPath = path.join(CONFIG.imgDir, localName);
    const webPath = `images/cards/local/${localName}`;
    
    // Check if this card already has a valid local image
    const existingLocalImg = card.local_target_img || card.target_img;
    if (CONFIG.skipSuccessful && existingLocalImg && 
        fs.existsSync(path.join(__dirname, '..', existingLocalImg)) && 
        fs.statSync(path.join(__dirname, '..', existingLocalImg)).size >= CONFIG.minSize) {
      console.log(`Card ${id}: already has valid image, skipping.`);
      skipped++;
      continue;
    }
    
    console.log(`\n🖼️  Card ${id}: fetching image…`);
    
    // 1. Try hardcoded URL first if available
    if (HARDCODED_URLS[id]) {
      try {
        console.log(`   📌 Using hardcoded medical image for: ${card.targetWord}`);
        debug(`Downloading from ${HARDCODED_URLS[id]}`);
        await download(HARDCODED_URLS[id], localPath);
        console.log(`   ✅ saved ${localName} (${fmt(fs.statSync(localPath).size)})`);
        
        // Update card data
        card.target_img = webPath;
        card.local_target_img = webPath;
        card.source_url = HARDCODED_URLS[id];
        
        successful++;
        // Continue to next card
        continue;
      } catch (err) {
        console.warn(`   ❌ Hardcoded URL failed: ${err.message}`);
        // Continue to Google search if hardcoded URL fails
      }
    }
    
    // 2. Try Google Image Search with multiple variations
    let downloaded = false;
    const searchVariations = buildSearchVariations(card);
    
    for (let variationIndex = 0; variationIndex < Math.min(searchVariations.length, CONFIG.maxRetries); variationIndex++) {
      if (downloaded) break;
      
      try {
        const searchTerm = searchVariations[variationIndex];
        debug(`Trying search variation ${variationIndex+1}/${Math.min(searchVariations.length, CONFIG.maxRetries)}: "${searchTerm}"`);
        
        // Get image URLs from Google
        const imageUrls = await getGoogleImageUrls(searchTerm);
        
        if (imageUrls.length === 0) {
          console.warn(`   ⚠️ No image URLs found for search: "${searchTerm}"`);
          // Try next variation
          continue;
        }
        
        // Try each URL until one works
        for (const url of imageUrls) {
          try {
            console.log(`   ↪ Trying ${url.substring(0, 80)}...`);
            await download(url, localPath);
            console.log(`   ✅ saved ${localName} (${fmt(fs.statSync(localPath).size)})`);
            
            // Update card data
            card.target_img = webPath;
            card.local_target_img = webPath;
            card.source_url = url;
            
            downloaded = true;
            successful++;
            break;
          } catch (err) {
            console.warn(`   ❌ Failed: ${err.message}`);
            // Continue to next URL
          }
        }
      } catch (err) {
        console.error(`   ❌ Search failed: ${err.message}`);
        if (err.stack) debug(err.stack);
      }
      
      // If this variation failed completely, wait before trying next variation
      if (!downloaded && variationIndex < searchVariations.length - 1) {
        console.log(`   ⏱️  Waiting before trying next search variation...`);
        await sleep(CONFIG.throttleMs);
      }
    }
    
    if (!downloaded) {
      console.error(`   ❌ All attempts failed for card ${id}: ${card.targetWord}`);
      failed++;
    }
    
    // Throttle to avoid rate limiting
    await sleep(CONFIG.throttleMs);
  }
  
  // Write updated card data back to file
  const updated = jsText.replace(/const tabooCards = \[[\s\S]*?\];/, `const tabooCards = ${JSON.stringify(cards, null, 2)};`);
  fs.writeFileSync(CONFIG.cardDataPath, updated, 'utf8');
  
  console.log(`\nDone. success:${successful}  failed:${failed}  skipped:${skipped}`);
})().catch(err => {
  console.error('Fatal error:', err);
  if (err.stack) debug(err.stack);
  process.exit(1);
}); 