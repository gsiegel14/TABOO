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

// Extract card information
function extractCardInfo() {
  const regex = /\{\s*id:\s*(\d+)[^{]*?targetWord:\s*"([^"]*)"[^{]*?(?=\{|];)/gs;
  const cards = [];
  let match;

  while ((match = regex.exec(cardDataContent)) !== null) {
    const id = parseInt(match[1]);
    const targetWord = match[2];
    cards.push({ id, targetWord });
  }
  
  return cards;
}

const cards = extractCardInfo();
console.log(`Found ${cards.length} cards`);

// Check which images we already have
function checkExistingFile(cardId) {
  const files = fs.readdirSync(imagesDir);
  const targetPattern = new RegExp(`^${cardId}_target\\.(jpg|jpeg|png|gif|webp)$`, 'i');
  return files.find(file => targetPattern.test(file));
}

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

// Example search terms for medical ultrasound images
const searchTermGenerator = {
  generic: (targetWord) => `ultrasound ${targetWord} medical image`,
  specificMap: {
    "Morison's Pouch View": "morison pouch ultrasound image",
    "Splenorenal Recess View": "splenorenal recess ultrasound image",
    "Bladder Long Axis": "bladder ultrasound long axis",
    "Subxiphoid Cardiac View": "subxiphoid cardiac ultrasound view",
    "Parasternal Long Axis (PLAX)": "PLAX echocardiography ultrasound",
    "Apical Four Chamber (A4C)": "apical four chamber view ultrasound",
    "IVC Long Axis": "IVC ultrasound long axis",
    "M-mode Seashore Sign": "m-mode seashore sign ultrasound",
    "A-lines (Normal Lung)": "a-lines normal lung ultrasound",
    "Lung Diaphragm View": "lung diaphragm ultrasound view",
    "Aorta Transverse (Normal)": "aorta transverse ultrasound normal",
    "Parasternal Short Axis (Aortic)": "parasternal short axis aortic valve ultrasound",
    "Popliteal Vein Compression": "popliteal vein compression ultrasound",
    "Parasternal Short Axis (Mitral)": "parasternal short axis mitral valve ultrasound",
    "Interscalene Block View": "interscalene brachial plexus block ultrasound",
    "Gallbladder Long Axis": "gallbladder long axis ultrasound",
    "Gallbladder Short Axis": "gallbladder short axis ultrasound",
    "Common Bile Duct (Normal)": "common bile duct normal ultrasound",
    "Kidney Long Axis": "kidney long axis ultrasound",
    "Bladder Volume Measurement Views": "bladder volume ultrasound measurement",
    "Erector Spinae Plane (ESP)": "erector spinae plane esp block ultrasound",
    "Apical Two Chamber (A2C)": "apical two chamber a2c ultrasound",
    "Thyroid Gland Transverse": "thyroid gland transverse ultrasound",
    "Carotid/IJ Long Axis": "carotid internal jugular long axis ultrasound",
    "Posterior Glenohumeral Joint": "posterior glenohumeral joint ultrasound",
    "Long‑Axis Triceps Tendon": "triceps tendon long axis ultrasound",
    "Ankle Joint": "ankle joint ultrasound",
    "Spleen Long Axis": "spleen long axis ultrasound",
    "Pleural Line Identification": "pleural line identification ultrasound",
    "Psoas Muscle": "psoas muscle ultrasound",
    "Rectus Abdominis Muscle": "rectus abdominis muscle ultrasound",
    "Superficial Cervical Plexus": "superficial cervical plexus ultrasound block",
    "Internal Jugular Vein Identification": "internal jugular vein ultrasound"
  }
};

// Generate search term for a given target word
function generateSearchTerm(targetWord) {
  return searchTermGenerator.specificMap[targetWord] || 
         searchTermGenerator.generic(targetWord);
}

// Common image search API URLs (for reference - not used directly in this script)
const searchUrls = {
  bing: "https://api.bing.microsoft.com/v7.0/images/search",
  google: "https://www.googleapis.com/customsearch/v1"
};

// Pre-defined image URLs for each card ID (manual curation)
const curatedImageUrls = {
  2: [
    "https://www.researchgate.net/profile/Keerthi-Reddy-3/publication/320041571/figure/fig4/AS:614161437655055@1523438608582/Focused-assessment-with-sonography-in-trauma-FAST-scan-showing-peri-splenic-collection.png",
    "https://www.ncbi.nlm.nih.gov/books/NBK557484/bin/LUQ_FAST.jpg"
  ],
  3: [
    "https://www.ncbi.nlm.nih.gov/books/NBK563197/bin/bladder_ultrasound.jpg",
    "https://www.researchgate.net/profile/Aftab-Alam-11/publication/328334897/figure/fig1/AS:682283549536257@1539694997545/Longitudinal-view-of-urinary-bladder-with-measurements-in-ultrasound-scan.png"
  ],
  7: [
    "https://www.ncbi.nlm.nih.gov/books/NBK470180/bin/IVC_Long_Axis.jpg",
    "https://www.researchgate.net/profile/Salman-Javed/publication/321757374/figure/fig2/AS:667830207729665@1536236405770/Ultrasonographic-image-of-the-inferior-vena-cava-IVC-measured-in-the-longitudinal.jpg"
  ],
  11: [
    "https://www.statpearls.com/pictures/getimagecontent//24572",
    "https://www.researchgate.net/profile/Anthony-Lewis-2/publication/336933587/figure/fig1/AS:822941094862848@1573224436054/Ultrasound-image-of-the-supraclavicular-brachial-plexus-showing-the-subclavian-artery.jpg"
  ],
  12: [
    "https://www.scielo.br/img/revistas/rb/v48n2/0100-3984-rb-48-02-0114-gf05.jpg",
    "https://www.researchgate.net/profile/Mohamed-Ismail-25/publication/342176345/figure/fig4/AS:903023310729219@1592353465018/Normal-aorta-on-transverse-view.png"
  ],
  13: [
    "https://www.wikidoc.org/images/7/79/PSAX-AV.JPG",
    "https://www.researchgate.net/profile/Kanchan-Ajbani/figure/fig8/AS:11431281141113194@1683634350644/Parasternal-short-axis-view-at-the-level-of-the-aortic-valve-PSAX-AV.png"
  ],
  14: [
    "https://www.researchgate.net/profile/Jing-Ting-Liou/publication/281282326/figure/fig2/AS:391439266156545@1470343828354/Transverse-ultrasound-image-of-the-right-knee-popliteal-fossa-Note-that-the-popliteal.png",
    "https://www.statpearls.com/pictures/getimagecontent//27176"
  ],
  15: [
    "https://www.wikidoc.org/images/4/47/PSAX-MV.JPG",
    "https://www.researchgate.net/profile/Alessandro-Lobina/publication/257753396/figure/fig2/AS:392583973261315@1470613173356/The-fishmouth-shape-of-the-mitral-valve-in-parasagittal-view.png"
  ],
  16: [
    "https://www.researchgate.net/profile/Araz-Pourmand/publication/340232725/figure/fig1/AS:870187272876032@1584562010135/Interscalene-block-approach-using-ultrasound-guidance-with-probe-orientation-and-needle.ppm",
    "https://www.researchgate.net/profile/De-Andres/publication/316910241/figure/fig1/AS:866177866801152@1583741767270/Parasagittal-ultrasound-view-of-the-brachial-plexus-A-Ultrasound-anatomy-of-the.png"
  ],
  17: [
    "https://www.researchgate.net/profile/Jorge-Rabat/publication/333231638/figure/fig2/AS:759336492634114@1558044693864/US-image-of-the-gallbladder-in-a-long-axis-view-GB-gallbladder-L-liver.png",
    "https://www.statpearls.com/pictures/getimagecontent//23246"
  ],
  18: [
    "https://www.researchgate.net/profile/Vikrant-Kale/publication/271335898/figure/fig2/AS:668320526127113@1536350901674/Sonographic-anatomy-of-gallbladder-SL-short-axis-longitudinal-section-T-transverse.png",
    "https://www.ultrasoundcases.info/uploads/images/Gallery/Adult-Gastrointestinal/Gallbladder-and-Biliary/Normal-Gallbladder/GallbladderShortAxisbig.jpg"
  ],
  19: [
    "https://www.researchgate.net/profile/Christoph-Dietrich/publication/344463118/figure/fig39/AS:942857566715906@1601880374096/Ultrasound-of-the-portal-vein-confluence-Transverse-abdominal-sonographic-image.jpg",
    "https://www.ncbi.nlm.nih.gov/books/NBK459338/bin/normal_CBD.jpg"
  ],
  20: [
    "https://www.researchgate.net/profile/Iftikhar-Ahmad-21/publication/359046595/figure/fig2/AS:11431281232330965@1699613018668/A-longitudinal-view-of-normal-kidney-ultrasound-showing-measurements-of-the-kidney.jpg",
    "https://www.statpearls.com/pictures/getimagecontent//25343"
  ],
  21: [
    "https://www.researchgate.net/profile/Mohamed-Gadelmoula/publication/335663673/figure/fig1/AS:801616936026113@1568223511915/Ultrasound-measurements-of-bladder-dimensions-A-Measurement-of-width-and-anterior.jpg",
    "https://www.ncbi.nlm.nih.gov/books/NBK564407/bin/bladder_ultrasound_dimensions.jpg"
  ]
};

// Function to download an image
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

// Process cards
async function processCards() {
  console.log('Starting to process cards...');
  const results = { success: 0, failed: 0, skipped: 0 };
  const failedCards = [];
  
  for (const card of cards) {
    try {
      // Check if we already have this file
      const existingFile = checkExistingFile(card.id);
      if (existingFile) {
        console.log(`⏭️ File already exists for card ${card.id}: ${existingFile}`);
        results.skipped++;
        continue;
      }
      
      // See if we have curated URLs for this card
      if (curatedImageUrls[card.id] && curatedImageUrls[card.id].length > 0) {
        let success = false;
        
        for (const url of curatedImageUrls[card.id]) {
          try {
            await downloadImage(url, card.id);
            success = true;
            results.success++;
            break;
          } catch (err) {
            console.log(`❌ Failed to download curated image: ${err.message}`);
          }
        }
        
        if (success) continue;
      }
      
      // If we get here, we couldn't download any curated images
      console.log(`❌ No successful downloads for card ${card.id}: ${card.targetWord}`);
      failedCards.push({ id: card.id, targetWord: card.targetWord });
      results.failed++;
      
    } catch (err) {
      console.error(`❌ Error processing card ${card.id}: ${err.message}`);
      failedCards.push({ id: card.id, targetWord: card.targetWord, error: err.message });
      results.failed++;
    }
    
    // Add delay between downloads
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Print summary
  console.log('\n=== Processing Summary ===');
  console.log(`✅ Successfully downloaded: ${results.success} images`);
  console.log(`❌ Failed to download: ${results.failed} images`);
  console.log(`⏭️ Skipped: ${results.skipped} images`);
  
  if (failedCards.length > 0) {
    console.log('\nFailed cards:');
    failedCards.forEach(card => {
      console.log(`Card ${card.id}: ${card.targetWord}`);
    });
  }
  
  // Update the card data file with the new image paths
  updateCardDataFile();
}

// Update card data file with new local image paths
function updateCardDataFile() {
  const imageFiles = fs.readdirSync(imagesDir)
    .filter(file => file.match(/^\d+_target\./))
    .reduce((acc, file) => {
      const match = file.match(/^(\d+)_target/);
      if (match) {
        const id = parseInt(match[1]);
        acc[id] = file;
      }
      return acc;
    }, {});
  
  let updatedContent = cardDataContent;
  
  for (const [cardId, filename] of Object.entries(imageFiles)) {
    const imageBasePath = 'images/cards/local/';
    const fullImagePath = imageBasePath + filename;
    
    // Update target_img and local_target_img
    updatedContent = updatedContent.replace(
      new RegExp(`(id:\\s*${cardId}[\\s\\S]*?target_img:\\s*")[^"]*(")`),
      `$1${fullImagePath}$2`
    );
    
    updatedContent = updatedContent.replace(
      new RegExp(`(id:\\s*${cardId}[\\s\\S]*?local_target_img:\\s*")[^"]*(")`),
      `$1${fullImagePath}$2`
    );
  }
  
  // Write the updated file
  fs.writeFileSync(cardDataPath, updatedContent);
  console.log('\nUpdated card data file with new image paths');
}

// Run the process
processCards().catch(console.error); 