const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// --- Configuration ---
const imagesDir = './images/cards/local';
const cardDataPath = './js/card-data.js';
const failedCardsPath = 'failed-cards.json';
const cardDataBackupPath = cardDataPath + '.backup';
// --- End Configuration ---

// Ensure images directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// --- Helper Functions (Adapted from download-from-urls.js) ---

function getFileExtension(url, contentType) {
  try {
    const urlPath = new URL(url).pathname;
    const extFromPath = path.extname(urlPath).toLowerCase();
    if (extFromPath && ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extFromPath)) {
      return extFromPath;
    }
  } catch (e) { /* Ignore invalid URL for extension guessing */ }

  if (contentType) {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
    if (contentType.includes('png')) return '.png';
    if (contentType.includes('gif')) return '.gif';
    if (contentType.includes('webp')) return '.webp';
  }
  return '.jpg'; // Default
}

function checkExistingFile(cardId) {
    try {
        const files = fs.readdirSync(imagesDir);
        const targetPattern = new RegExp(`^${cardId}_target\\.(jpg|jpeg|png|gif|webp)$`, 'i');
        return files.find(file => targetPattern.test(file));
    } catch (e) {
        console.error(`Error reading image directory ${imagesDir}: ${e.message}`);
        return null; // Treat as no file existing
    }
}


// Simplified download function - assumes URL is likely valid
function downloadImage(url, id) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Attempting download for card ${id} from ${url}`);
      const existingFile = checkExistingFile(id);
       if (existingFile) {
           console.log(`⏭️ File already exists for card ${id}: ${existingFile}`);
           // Resolve with existing path, assuming it's correct for reporting
           return resolve({ filePath: path.join(imagesDir, existingFile), newUrl: url, downloaded: false });
       }

      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (e) {
        return reject(new Error(`Invalid URL: ${url}`));
      }

      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        },
        timeout: 15000
      };

      const req = protocol.get(url, options, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log(`Redirect: ${res.statusCode} -> ${res.headers.location}`);
          // Follow redirect once
          return downloadImage(res.headers.location, id).then(resolve).catch(reject);
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP status code ${res.statusCode}`));
        }
        const contentType = res.headers['content-type'] || '';
        if (!contentType.includes('image')) {
          return reject(new Error(`Not an image: ${contentType}`));
        }

        const extension = getFileExtension(url, contentType);
        const filePath = path.join(imagesDir, `${id}_target${extension}`);
        const fileStream = fs.createWriteStream(filePath);
        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Saved image for card ${id} to ${filePath}`);
          resolve({ filePath, newUrl: url, downloaded: true }); // Include the URL that worked
        });
        fileStream.on('error', (err) => {
          fs.unlink(filePath, () => {});
          reject(err);
        });
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Function to test a URL with a HEAD request
function testUrl(url) {
    return new Promise((resolve) => {
        try {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            const options = {
                method: 'HEAD',
                timeout: 8000, // Shorter timeout for testing
                 headers: { // Add User-Agent for HEAD requests too
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': '*/*' // Accept anything for HEAD
                }
            };

            const req = protocol.request(url, options, (res) => {
                 // Follow one redirect for HEAD requests
                 if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    console.log(`HEAD Redirect: ${res.statusCode} -> ${res.headers.location}`);
                    // Resolve promise by testing the redirect location
                    testUrl(res.headers.location).then(resolve);
                    return; // Stop processing this response
                }

                const contentType = res.headers['content-type'] || '';
                resolve({
                    accessible: res.statusCode >= 200 && res.statusCode < 300,
                    isImage: contentType.startsWith('image/'),
                    status: res.statusCode,
                    contentType: contentType
                });
            });

            req.on('error', (e) => {
                console.warn(`HEAD request error for ${url}: ${e.message}`);
                resolve({ accessible: false, isImage: false, status: 0, contentType: null });
            });
            req.on('timeout', () => {
                req.destroy();
                console.warn(`HEAD request timeout for ${url}`);
                resolve({ accessible: false, isImage: false, status: 0, contentType: null });
            });
            req.end();
        } catch (error) {
             console.warn(`URL parsing error for ${url}: ${error.message}`);
            resolve({ accessible: false, isImage: false, status: 0, contentType: null });
        }
    });
}


// --- Main Retry Logic ---

async function retryFailedDownloads() {
  if (!fs.existsSync(failedCardsPath)) {
    console.log(`'${failedCardsPath}' not found. No failures to retry.`);
    return;
  }
  if (!fs.existsSync(cardDataPath)) {
      console.error(`Card data file '${cardDataPath}' not found.`);
      return;
  }


  const failedCards = JSON.parse(fs.readFileSync(failedCardsPath, 'utf8'));
  let cardDataContent = fs.readFileSync(cardDataPath, 'utf8');

  // Backup original card data
   if (!fs.existsSync(cardDataBackupPath)) {
        fs.copyFileSync(cardDataPath, cardDataBackupPath);
        console.log(`Backed up original card data to ${cardDataBackupPath}`);
   } else {
        console.log(`Backup file ${cardDataBackupPath} already exists.`);
   }


  console.log(`Retrying ${failedCards.length} failed cards...`);

  const results = {
    fixed: [],
    stillFailing: [],
  };

  for (const failedCard of failedCards) {
    const cardId = failedCard.id;
    const originalUrl = failedCard.url; // Use the URL from the failed list
    let success = false;
    let attemptedUrl = null; // Store the URL that was actually attempted

    console.log(`\n--- Retrying Card ${cardId} (Original URL: ${originalUrl}) ---`);

    // Check if file exists already (maybe downloaded manually or in a previous partial run)
     const existingFile = checkExistingFile(cardId);
     if (existingFile) {
         console.log(`✅ Skipping Card ${cardId}: File ${existingFile} already exists.`);
         // Assume it's fixed if file exists, use original URL for reporting simplicity here
         results.fixed.push({ id: cardId, originalUrl: originalUrl, newUrl: originalUrl, note: "File already existed" });
         success = true;
         continue; // Skip to next card
     }


    // Strategy 1: Wikimedia Special:FilePath
    if (originalUrl.includes('commons.wikimedia.org/wiki/File:')) {
      try {
        const filename = originalUrl.split('File:')[1].split('#')[0]; // Get filename, remove fragments
        if (filename) {
           attemptedUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
           console.log(`Strategy 1 (Wikimedia FilePath): Testing ${attemptedUrl}`);
           const testResult = await testUrl(attemptedUrl);
            if (testResult.accessible && testResult.isImage) {
                console.log(`Test OK (Status: ${testResult.status}, Type: ${testResult.contentType}). Attempting download...`);
                try {
                    const downloadResult = await downloadImage(attemptedUrl, cardId);
                    results.fixed.push({ id: cardId, originalUrl, newUrl: downloadResult.newUrl, filePath: downloadResult.filePath });
                    success = true;
                } catch (downloadErr) {
                    console.error(`Download failed for ${attemptedUrl}: ${downloadErr.message}`);
                }
            } else {
                 console.log(`Test Failed (Accessible: ${testResult.accessible}, IsImage: ${testResult.isImage}, Status: ${testResult.status})`);
            }
        }
      } catch (e) { console.error(`Error applying Strategy 1: ${e.message}`); }
    }

    // Strategy 2: Google URL Decoding (Only if Strategy 1 didn't succeed)
    if (!success && originalUrl.includes('google.com/url')) {
      try {
        const urlObj = new URL(originalUrl);
        const directUrl = urlObj.searchParams.get('url');
        if (directUrl) {
          attemptedUrl = directUrl;
          console.log(`Strategy 2 (Google Decode): Testing ${attemptedUrl}`);
          const testResult = await testUrl(attemptedUrl);
           if (testResult.accessible && testResult.isImage) {
                 console.log(`Test OK (Status: ${testResult.status}, Type: ${testResult.contentType}). Attempting download...`);
                 try {
                    const downloadResult = await downloadImage(attemptedUrl, cardId);
                    results.fixed.push({ id: cardId, originalUrl, newUrl: downloadResult.newUrl, filePath: downloadResult.filePath });
                    success = true;
                } catch (downloadErr) {
                    console.error(`Download failed for ${attemptedUrl}: ${downloadErr.message}`);
                }
            } else {
                console.log(`Test Failed (Accessible: ${testResult.accessible}, IsImage: ${testResult.isImage}, Status: ${testResult.status})`);
            }
        }
      } catch (e) { console.error(`Error applying Strategy 2: ${e.message}`); }
    }

    // Add other strategies here if needed (e.g., simple URL cleanup)


    if (!success) {
        console.log(`❌ Card ${cardId} could not be fixed automatically.`);
        results.stillFailing.push({ id: cardId, originalUrl, error: failedCard.error }); // Keep original error
    }

     // Add a small delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // --- Update card-data.js ---
  if (results.fixed.length > 0) {
     console.log(`\nUpdating card-data.js with ${results.fixed.length} fixed URLs...`);
     let updatedContent = cardDataContent;
     for (const fixed of results.fixed) {
        if (fixed.note === "File already existed") continue; // Don't update if we just found the file

         // Escape URLs for regex replacement
         const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
         const originalUrlEscaped = escapeRegex(fixed.originalUrl);
         const newUrlEscaped = fixed.newUrl.replace(/`/g, '\\`'); // Escape backticks for template literal

         // Construct regex to find the specific card's remote_target_img
         // Be careful with multiline matching and ensuring uniqueness
         const cardRegex = new RegExp(`(id:\\s*${fixed.id}[\\s\\S]*?remote_target_img:\\s*")(${originalUrlEscaped})(")`,'m');

         const match = updatedContent.match(cardRegex);
         if (match) {
             updatedContent = updatedContent.replace(cardRegex, `$1${newUrlEscaped}$3`);
              console.log(`Updated URL for card ${fixed.id}`);
         } else {
             console.warn(`Could not find card ${fixed.id} with original URL ${fixed.originalUrl} in card-data.js to update.`);
              // Add this card back to stillFailing as we couldn't update it
              results.stillFailing.push({ id: fixed.id, originalUrl: fixed.originalUrl, error: "Update failed: Card/URL mismatch in source file." });
              // Remove from fixed list if update failed
              results.fixed = results.fixed.filter(f => f.id !== fixed.id);

         }
     }
     fs.writeFileSync(cardDataPath, updatedContent);
     console.log(`Successfully wrote updates to ${cardDataPath}`);
 }


  // --- Final Report ---
  console.log('\n\n=== Retry Summary ===');
  console.log(`✅ Fixed and Downloaded: ${results.fixed.length} cards`);
  results.fixed.forEach(f => console.log(`  - Card ${f.id}: ${f.note || `New URL -> ${f.newUrl}`}`));

  console.log(`\n❌ Still Failing (Require Manual URL Update): ${results.stillFailing.length} cards`);
  results.stillFailing.forEach(f => console.log(`  - Card ${f.id}: ${f.originalUrl} (Error: ${f.error})`));

  if (results.stillFailing.length > 0) {
      fs.writeFileSync('still-failing-cards.json', JSON.stringify(results.stillFailing, null, 2));
      console.log('\nWrote details of cards needing manual fixes to still-failing-cards.json');
  } else {
      // Clean up still-failing file if it exists and is now empty
       if (fs.existsSync('still-failing-cards.json')) {
            fs.unlinkSync('still-failing-cards.json');
            console.log('Removed empty still-failing-cards.json');
       }
  }
   // Optionally remove the old failed-cards.json if all were fixed or reported as still failing
   if (fs.existsSync(failedCardsPath) && results.fixed.length + results.stillFailing.length === failedCards.length) {
        // fs.unlinkSync(failedCardsPath);
        // console.log(`Removed original ${failedCardsPath} as all cards were processed.`);
        // Let's keep the original failed-cards for reference for now.
   }

}

// --- Run the Script ---
retryFailedDownloads().catch(err => {
  console.error('\nScript Error:', err);
}); 