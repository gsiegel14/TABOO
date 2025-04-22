/**
 * Manual Image Downloader
 * 
 * This script uses Wikimedia's thumb functionality to download
 * images consistently with fixed patterns.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Target card to download (use command line argument)
const targetCardId = parseInt(process.argv[2], 10);

if (!targetCardId || isNaN(targetCardId)) {
  console.error('Please provide a card ID as argument.');
  console.error('Usage: node manual-download.js CARD_ID');
  console.error('Example: node manual-download.js 8');
  process.exit(1);
}

// Setup paths
const localPath = path.join(__dirname, '../images/cards/local');
if (!fs.existsSync(localPath)) {
  fs.mkdirSync(localPath, { recursive: true });
}

// Map of card IDs to filenames (these are the known problematic ones)
const cardFilenames = {
  2: { filename: "Splenorenal_recess_ultrasound.png", hash: "f" },
  8: { filename: "Barcode_sign_M_mode_pneumothorax.png", hash: "8" },
  10: { filename: "Pleural_effusion_with_jellyfish_sign.png", hash: "5" },
  11: { filename: "Lung_ultrasound_pneumonia_consolidation.png", hash: "2" },
  14: { filename: "Popliteal_vein_thrombosis_ultrasound.jpg", hash: "5" },
  16: { filename: "Brachial_plexus_ultrasound_C5_C6_roots.png", hash: "8" },
  19: { filename: "Soft_tissue_abscess_ultrasound.png", hash: "8" },
  20: { filename: "Ultrasound_gestational_sac.png", hash: "5" },
  21: { filename: "Ectopic_pregnancy_ultrasound.png", hash: "7" },
  22: { filename: "Retinal_detachment_ultrasound.jpg", hash: "1" },
  23: { filename: "Optic_nerve_sheath_dilation_ultrasound.png", hash: "9" },
  29: { filename: "In_plane_needle_ultrasound.png", hash: "3" },
  31: { filename: "Popliteal_sciatic_ultrasound.png", hash: "4" },
  33: { filename: "A4C_RV_dilation.png", hash: "0" },
  34: { filename: "Focused_cardiac_ultrasound_views.svg", hash: "1" },
  35: { filename: "Lung_point_static_ultrasound.png", hash: "4" }
};

// Exit if no filename for this card
if (!cardFilenames[targetCardId]) {
  console.error(`No filename found for card ID ${targetCardId}`);
  process.exit(1);
}

// Get the filename info
const { filename, hash } = cardFilenames[targetCardId];
const ext = filename.split('.').pop();

// Create destination paths
const targetFilePath = path.join(localPath, `${targetCardId}_target_${filename}`);

// Wikimedia URLs for different formats
// These URLs all follow standard patterns
function getWikimediaUrls(filename, hash) {
  const firstChar = hash || filename.charAt(0).toLowerCase();
  const firstTwoChars = (hash + filename.charAt(0)).toLowerCase().substring(0, 2); 
  
  return {
    // Direct URL to original file
    original: `https://upload.wikimedia.org/wikipedia/commons/${firstChar}/${firstTwoChars}/${filename}`,
    
    // Thumb URL - reliable way to get scaled images
    thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/${firstChar}/${firstTwoChars}/${filename}/800px-${filename}`,
    
    // Special redirect that handles most formats
    redirect: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${filename}?width=800`,
    
    // API URL that can provide direct download links
    api: `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`,
    
    // Img direct URL
    img: `https://commons.wikimedia.org/wiki/File:${filename}?uselang=en`
  };
}

// Get all possible URLs for this image
const urls = getWikimediaUrls(filename, hash);

// Function to run a curl command and check if it succeeded
function tryCurlDownload(url, outputPath, description) {
  console.log(`\n🔍 Trying ${description}:`);
  console.log(`🌐 URL: ${url}`);
  console.log(`📂 Output: ${outputPath}`);
  
  try {
    // Create a curl command with proper headers
    const curlCommand = `curl --location --fail --silent --output "${outputPath}" ` +
                        `--max-time 30 ` +
                        `-A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15" ` +
                        `"${url}"`;
    
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
        console.log(`🔍 File type: ${fileType.split(':')[1].trim()}`);
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

// Main download function
function downloadImage() {
  console.log(`🎯 Processing card ID ${targetCardId}: ${filename}`);
  
  // Create temp paths for each attempt
  const paths = {
    original: path.join(localPath, `${targetCardId}_orig_${filename}`),
    thumb: path.join(localPath, `${targetCardId}_thumb_${filename}`),
    redirect: path.join(localPath, `${targetCardId}_redir_${filename}`),
    weserv: path.join(localPath, `${targetCardId}_weserv_${filename}`),
    googleCache: path.join(localPath, `${targetCardId}_gcache_${filename}`)
  };
  
  // Try thumb URL (most reliable method)
  if (tryCurlDownload(urls.thumb, paths.thumb, "THUMB URL")) {
    fs.copyFileSync(paths.thumb, targetFilePath);
    console.log(`✅ Successfully saved to ${targetFilePath}`);
    return true;
  }
  
  // Try redirect URL
  if (tryCurlDownload(urls.redirect, paths.redirect, "REDIRECT URL")) {
    fs.copyFileSync(paths.redirect, targetFilePath);
    console.log(`✅ Successfully saved to ${targetFilePath}`);
    return true;
  }
  
  // Try original URL
  if (tryCurlDownload(urls.original, paths.original, "ORIGINAL URL")) {
    fs.copyFileSync(paths.original, targetFilePath);
    console.log(`✅ Successfully saved to ${targetFilePath}`);
    return true;
  }
  
  // Try weserv proxy
  const weservUrl = `https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/commons/${hash}/${hash + filename.charAt(0).toLowerCase()}/${filename}&default=error&output=jpg`;
  
  if (tryCurlDownload(weservUrl, paths.weserv, "WESERV PROXY")) {
    fs.copyFileSync(paths.weserv, targetFilePath);
    console.log(`✅ Successfully saved to ${targetFilePath}`);
    return true;
  }
  
  console.error("❌ All download attempts failed");
  return false;
}

// Run the download function
downloadImage(); 