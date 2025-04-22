const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Create directory if it doesn't exist
const localDir = path.join(__dirname, '../images/cards/local');
if (!fs.existsSync(localDir)) {
  fs.mkdirSync(localDir, { recursive: true });
}

// Reliable image sources (mostly from Unsplash and other public domain sources)
const reliableImageSources = {
  // Format: cardId: { name: "descriptive_name", url: "reliable_url", description: "what the image shows" }
  2: { name: "Spleen_ultrasound", url: "https://images.unsplash.com/photo-1585828922344-85c9daa264b0", description: "Ultrasound machine" },
  8: { name: "Ultrasound_scan", url: "https://images.unsplash.com/photo-1579154341098-e4e158cc7f55", description: "Ultrasound scan" },
  10: { name: "Medical_scan", url: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28", description: "Medical imaging" },
  11: { name: "Lung_scan", url: "https://images.unsplash.com/photo-1516549655669-8338b4c79468", description: "Medical imaging display" },
  14: { name: "Vascular_scan", url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef", description: "Medical scan display" },
  16: { name: "Neck_scan", url: "https://images.unsplash.com/photo-1582719471384-894fbb16e074", description: "Medical technology" },
  19: { name: "Tissue_scan", url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d", description: "Medical imaging" },
  20: { name: "Pregnancy_scan", url: "https://images.unsplash.com/photo-1631815588090-d4bfec5b7e2e", description: "Ultrasound image" },
  21: { name: "Abdominal_scan", url: "https://images.unsplash.com/photo-1590012987311-c253cb2387f7", description: "Ultrasound procedure" },
  22: { name: "Eye_scan", url: "https://images.unsplash.com/photo-1551601651-3d4b1d65cc7b", description: "Eye examination" },
  23: { name: "Nerve_scan", url: "https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe", description: "Medical examination" },
  29: { name: "Needle_procedure", url: "https://images.unsplash.com/photo-1584363565838-f9d8b2a53dde", description: "Medical procedure" },
  31: { name: "Leg_scan", url: "https://images.unsplash.com/photo-1581595219315-a187dd40c322", description: "Ultrasound procedure" },
  33: { name: "Heart_scan", url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d", description: "Cardiac imaging" },
  34: { name: "Protocol_diagram", url: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28", description: "Medical diagram" },
  35: { name: "Lung_imaging", url: "https://images.unsplash.com/photo-1583324113626-70df0f4deaab", description: "Medical imaging" }
};

// Download an image using HTTPS module with proper error handling and timeouts
function downloadImage(cardId) {
  const imageInfo = reliableImageSources[cardId];
  if (!imageInfo) {
    console.error(`❌ No image info found for card ${cardId}`);
    return false;
  }

  const url = imageInfo.url;
  const fileName = `${cardId}_target_${imageInfo.name}.jpg`;
  const filePath = path.join(localDir, fileName);
  
  console.log(`🔍 Downloading for card ${cardId}: ${imageInfo.description}`);
  console.log(`🌐 URL: ${url}`);
  console.log(`📂 Saving to: ${filePath}`);

  // Check if file already exists and is valid
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.size > 5000) { // 5KB minimum size
      console.log(`✅ File already exists and appears valid. Size: ${stats.size} bytes`);
      return true;
    } else {
      console.log(`⚠️ File exists but seems too small (${stats.size} bytes). Redownloading...`);
    }
  }

  // Create a write stream
  const file = fs.createWriteStream(filePath);
  
  return new Promise((resolve) => {
    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15'
      },
      timeout: 30000 // 30 second timeout
    }, (response) => {
      // Check if the response is successful (status code 200-299)
      if (response.statusCode < 200 || response.statusCode >= 300) {
        file.close();
        fs.unlinkSync(filePath);
        console.error(`❌ HTTP Error: ${response.statusCode}`);
        resolve(false);
        return;
      }

      // Pipe the response to the file
      response.pipe(file);

      // When the download is complete, close the file
      file.on('finish', () => {
        file.close();
        
        // Verify the file was downloaded successfully
        const stats = fs.statSync(filePath);
        if (stats.size < 1000) { // 1KB minimum size
          console.error(`❌ Downloaded file too small: ${stats.size} bytes`);
          fs.unlinkSync(filePath);
          resolve(false);
        } else {
          console.log(`✅ Successfully downloaded. Size: ${stats.size} bytes`);
          resolve(true);
        }
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.error(`❌ Download error: ${err.message}`);
      resolve(false);
    });

    // Set a timeout
    request.on('timeout', () => {
      request.destroy();
      file.close();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.error('❌ Download timeout');
      resolve(false);
    });
  });
}

// Update the card data file with local image paths
function updateCardDataFile(cardIds) {
  const cardDataPath = path.join(__dirname, '../js/card-data.js');
  
  if (!fs.existsSync(cardDataPath)) {
    console.error(`❌ Card data file not found: ${cardDataPath}`);
    return false;
  }
  
  let cardData = fs.readFileSync(cardDataPath, 'utf8');
  let updated = false;
  
  for (const cardId of cardIds) {
    const imageInfo = reliableImageSources[cardId];
    if (!imageInfo) continue;
    
    const fileName = `${cardId}_target_${imageInfo.name}.jpg`;
    const localPath = `images/cards/local/${fileName}`;
    
    // Find the card in the data and update the local_target_img property
    const cardRegex = new RegExp(`(id:\\s*${cardId}[^}]*?local_target_img:\\s*["'])([^"']*)(["'][^}]*})`, 'gs');
    const match = cardRegex.exec(cardData);
    
    if (match) {
      console.log(`📝 Updating card ${cardId} with local path: ${localPath}`);
      cardData = cardData.replace(cardRegex, `$1${localPath}$3`);
      updated = true;
    } else {
      console.error(`❌ Could not find card ${cardId} in the data file`);
    }
  }
  
  if (updated) {
    fs.writeFileSync(cardDataPath, cardData);
    console.log(`✅ Updated card data file with new local image paths`);
    return true;
  } else {
    console.error(`❌ No updates made to card data file`);
    return false;
  }
}

// Main function to download all images and update card data
async function main() {
  console.log('🚀 Starting download of reliable placeholder images...\n');
  
  const cardIds = Object.keys(reliableImageSources).map(id => parseInt(id));
  const downloadResults = [];
  
  // Download each image sequentially to avoid overwhelming the server
  for (const cardId of cardIds) {
    const success = await downloadImage(cardId);
    downloadResults.push({ cardId, success });
    console.log(''); // Add a line break for readability
  }
  
  // Update the card data file with the downloaded images
  const successfulDownloads = downloadResults.filter(r => r.success).map(r => r.cardId);
  if (successfulDownloads.length > 0) {
    updateCardDataFile(successfulDownloads);
  }
  
  // Print summary
  const successful = downloadResults.filter(r => r.success);
  const failed = downloadResults.filter(r => !r.success);
  
  console.log('--- SUMMARY ---');
  console.log(`Total images: ${cardIds.length}`);
  console.log(`Successfully downloaded: ${successful.length}`);
  console.log(`Failed to download: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed downloads:');
    failed.forEach(f => {
      const info = reliableImageSources[f.cardId];
      console.log(`Card ${f.cardId}: ${info.name}`);
    });
  }
  
  console.log('\nDone! 🎉');
}

// Run the main function
main().catch(err => console.error('❌ Unhandled error:', err)); 