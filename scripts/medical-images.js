/**
 * Medical Images Downloader
 * 
 * This script downloads ultrasound images from alternative 
 * medical education sites as replacements for the failed Wikimedia images.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create destination directory
const localPath = path.join(__dirname, '../images/cards/local');
if (!fs.existsSync(localPath)) {
  fs.mkdirSync(localPath, { recursive: true });
}

// Alternative sources for medical ultrasound images
// These are from medical education sites with public images
const alternativeSources = {
  2: {
    name: "Splenorenal_view",
    url: "https://www.coreultrasound.com/wp-content/uploads/2021/08/LUQ-View.jpg",
    description: "LUQ view showing spleen-kidney interface"
  },
  8: {
    name: "Barcode_sign",
    url: "https://ars.els-cdn.com/content/image/3-s2.0-B9780323497992000137-f13-05-9780323497992.jpg",
    description: "M-mode barcode sign in pneumothorax"
  },
  10: {
    name: "Pleural_effusion",
    url: "https://www.coreultrasound.com/wp-content/uploads/2015/10/Small-Effusion.jpg",
    description: "Pleural effusion with jellyfish sign"
  },
  11: {
    name: "Lung_consolidation",
    url: "https://www.coreultrasound.com/wp-content/uploads/2019/01/Pneumonia.jpg",
    description: "Lung consolidation with air bronchograms"
  },
  14: {
    name: "DVT_popliteal",
    url: "https://www.coreultrasound.com/wp-content/uploads/2019/05/DVT.jpg",
    description: "Popliteal vein DVT long-axis view"
  },
  16: {
    name: "Interscalene_block",
    url: "https://www.nysora.com/wp-content/uploads/2019/10/Interscalene-Brachial-Plexus-Block-Figure-1-scaled.jpg",
    description: "Interscalene block showing brachial plexus roots"
  },
  19: {
    name: "Soft_tissue_abscess",
    url: "https://www.coreultrasound.com/wp-content/uploads/2021/06/cellulitis-with-abscess.jpg",
    description: "Soft tissue abscess with posterior enhancement"
  },
  20: {
    name: "Gestational_sac",
    url: "https://www.coreultrasound.com/wp-content/uploads/2015/06/IUP-with-yolk-and-embryo.jpg",
    description: "Early intrauterine pregnancy with gestational sac and yolk"
  },
  21: {
    name: "Ectopic_pregnancy",
    url: "https://www.coreultrasound.com/wp-content/uploads/2015/06/free-fluid-in-pelvis.jpg",
    description: "Ectopic pregnancy with free fluid"
  },
  22: {
    name: "Retinal_detachment",
    url: "https://www.coreultrasound.com/wp-content/uploads/2019/01/retinal-detachment.jpg",
    description: "Retinal detachment ultrasound"
  },
  23: {
    name: "Optic_nerve_sheath",
    url: "https://www.coreultrasound.com/wp-content/uploads/2015/06/ONSD.jpg",
    description: "Dilated optic nerve sheath diameter"
  },
  29: {
    name: "In_plane_needle",
    url: "https://www.nysora.com/wp-content/uploads/2019/03/an-in-plane-approach-allows-for-visualization-of-the-entire-needle-shaft-and-tip.jpg",
    description: "In-plane needle technique showing full needle path"
  },
  31: {
    name: "Popliteal_block",
    url: "https://www.nysora.com/wp-content/uploads/2019/03/ultrasound-image-sciatic-nerve-popliteal-fossa.jpg",
    description: "Popliteal sciatic nerve block"
  },
  33: {
    name: "RV_dilation",
    url: "https://www.coreultrasound.com/wp-content/uploads/2015/06/RV-dilation.jpg",
    description: "Apical 4-chamber view showing RV dilation in PE"
  },
  34: {
    name: "RUSH_protocol",
    url: "https://www.coreultrasound.com/wp-content/uploads/2015/07/Rush-Pump-Tank-Pipes.jpg",
    description: "RUSH protocol diagram showing pump, tank, and pipes"
  },
  35: {
    name: "Lung_point",
    url: "https://thoracickey.com/wp-content/uploads/2020/02/00075-9780323661270.gi16.jpg",
    description: "Lung point sign showing transition from pneumothorax to normal lung"
  }
};

// Function to download a single image
function downloadImage(cardId) {
  if (!alternativeSources[cardId]) {
    console.error(`No alternative source found for card ID ${cardId}`);
    return false;
  }
  
  const source = alternativeSources[cardId];
  const ext = source.url.split('.').pop();
  const outputPath = path.join(localPath, `${cardId}_target_${source.name}.${ext}`);
  
  console.log(`\n🔍 Downloading for card ${cardId}: ${source.description}`);
  console.log(`🌐 URL: ${source.url}`);
  console.log(`📂 Saving to: ${outputPath}`);
  
  try {
    // Create a curl command with proper headers
    const curlCommand = `curl --location --fail --silent --output "${outputPath}" ` +
                       `--max-time 30 ` +
                       `-A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15" ` +
                       `"${source.url}"`;
    
    // Execute curl
    execSync(curlCommand);
    
    // Check if file exists and is valid
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      
      if (stats.size < 5000) {
        console.log(`⚠️ Warning: File too small (${stats.size} bytes)`);
        return false;
      }
      
      // Check file type
      try {
        const fileType = execSync(`file "${outputPath}"`).toString();
        
        if (fileType.toLowerCase().includes('html') || fileType.toLowerCase().includes('text')) {
          console.log(`⚠️ Warning: File is HTML/text, not an image: ${fileType.trim()}`);
          return false;
        }
        
        console.log(`✅ Successfully downloaded! (${stats.size} bytes)`);
        return true;
      } catch (err) {
        console.error(`❌ Error checking file type: ${err.message}`);
      }
    }
    
    return false;
  } catch (err) {
    console.error(`❌ Curl error: ${err.message}`);
    return false;
  }
}

// Function to update card data in JS file
function updateCardDataFile(cardIds) {
  // Path to card data file
  const cardDataPath = path.join(__dirname, '../js/card-data.js');
  
  if (!fs.existsSync(cardDataPath)) {
    console.error(`❌ Card data file not found: ${cardDataPath}`);
    return;
  }
  
  // Read the current card data
  const cardDataContent = fs.readFileSync(cardDataPath, 'utf8');
  const tabooCardsMatch = cardDataContent.match(/const tabooCards = (\[[\s\S]*?\]);/);
  
  if (!tabooCardsMatch) {
    console.error('❌ Could not parse tabooCards from card-data.js');
    return;
  }
  
  // Evaluate the array content
  const tabooCards = eval(tabooCardsMatch[1]);
  console.log(`\n📋 Found ${tabooCards.length} cards in card-data.js`);
  
  // Update each card with the new image path
  let updatedCount = 0;
  
  for (const cardId of cardIds) {
    if (!alternativeSources[cardId]) continue;
    
    const card = tabooCards.find(c => c.id === cardId);
    if (!card) {
      console.error(`❌ Card ID ${cardId} not found in card data`);
      continue;
    }
    
    const source = alternativeSources[cardId];
    const ext = source.url.split('.').pop();
    const imagePath = `images/cards/local/${cardId}_target_${source.name}.${ext}`;
    
    // Update card data
    card.target_img = imagePath;
    card.local_target_img = imagePath;
    
    console.log(`✏️ Updated card ${cardId} to use image: ${imagePath}`);
    updatedCount++;
  }
  
  // Save updated card data
  console.log(`\n💾 Updating ${updatedCount} cards in card-data.js...`);
  
  let updatedCardData = cardDataContent.replace(
    /const tabooCards = \[[\s\S]*?\];/, 
    `const tabooCards = ${JSON.stringify(tabooCards, null, 4)};`
  );
  
  fs.writeFileSync(cardDataPath, updatedCardData, 'utf8');
  console.log(`✅ Updated card data saved to ${cardDataPath}`);
}

// Main function
function main() {
  console.log('🚀 Starting download of alternative medical images...');
  
  // Track successful downloads
  const successfulDownloads = [];
  const failedDownloads = [];
  
  // Download each image 
  for (const cardId of Object.keys(alternativeSources).map(id => parseInt(id, 10))) {
    const result = downloadImage(cardId);
    
    if (result) {
      successfulDownloads.push(cardId);
    } else {
      failedDownloads.push(cardId);
    }
  }
  
  // Update card data file with new paths
  if (successfulDownloads.length > 0) {
    updateCardDataFile(successfulDownloads);
  }
  
  // Print summary
  console.log('\n--- SUMMARY ---');
  console.log(`Total images: ${Object.keys(alternativeSources).length}`);
  console.log(`Successfully downloaded: ${successfulDownloads.length}`);
  console.log(`Failed to download: ${failedDownloads.length}`);
  
  if (failedDownloads.length > 0) {
    console.log('\n❌ Failed downloads:');
    failedDownloads.forEach(cardId => {
      console.log(`Card ${cardId}: ${alternativeSources[cardId].name}`);
    });
  }
  
  console.log('\nDone! 🎉');
}

// Run the main function
main(); 