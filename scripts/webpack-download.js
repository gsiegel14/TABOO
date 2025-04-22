/**
 * Targeted Single-Image Downloader
 * 
 * Downloads a specific Wikimedia image using multiple methods
 * and provides detailed debugging information.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

// Target card to download (use command line argument)
const targetCardId = parseInt(process.argv[2], 10);

if (!targetCardId || isNaN(targetCardId)) {
  console.error('Please provide a card ID as argument.');
  console.error('Usage: node webpack-download.js CARD_ID');
  console.error('Example: node webpack-download.js 8');
  process.exit(1);
}

// Setup paths
const localPath = path.join(__dirname, '../images/cards/downloads');
if (!fs.existsSync(localPath)) {
  fs.mkdirSync(localPath, { recursive: true });
}

// Image data table (just card IDs and URLs)
const cardUrls = {
  2: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Splenorenal_recess_ultrasound.png",
  8: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Barcode_sign_M_mode_pneumothorax.png",
  10: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Pleural_effusion_with_jellyfish_sign.png",
  11: "https://upload.wikimedia.org/wikipedia/commons/2/25/Lung_ultrasound_pneumonia_consolidation.png",
  14: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Popliteal_vein_thrombosis_ultrasound.jpg",
  16: "https://upload.wikimedia.org/wikipedia/commons/8/89/Brachial_plexus_ultrasound_C5_C6_roots.png",
  19: "https://upload.wikimedia.org/wikipedia/commons/8/89/Soft_tissue_abscess_ultrasound.png",
  20: "https://upload.wikimedia.org/wikipedia/commons/5/59/Ultrasound_gestational_sac.png",
  21: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Ectopic_pregnancy_ultrasound.png",
  22: "https://upload.wikimedia.org/wikipedia/commons/1/19/Retinal_detachment_ultrasound.jpg",
  23: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Optic_nerve_sheath_dilation_ultrasound.png",
  29: "https://upload.wikimedia.org/wikipedia/commons/3/3e/In_plane_needle_ultrasound.png",
  31: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Popliteal_sciatic_ultrasound.png",
  33: "https://upload.wikimedia.org/wikipedia/commons/0/0a/A4C_RV_dilation.png",
  34: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Focused_cardiac_ultrasound_views.svg",
  35: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Lung_point_static_ultrasound.png"
};

// Alternative URLs for problematic images
const alternativeUrls = {
  8: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Barcode_sign_M_mode_pneumothorax.png/800px-Barcode_sign_M_mode_pneumothorax.png",
  10: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Pleural_effusion_with_jellyfish_sign.png/800px-Pleural_effusion_with_jellyfish_sign.png",
  11: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Lung_ultrasound_pneumonia_consolidation.png/800px-Lung_ultrasound_pneumonia_consolidation.png",
  14: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Popliteal_vein_thrombosis_ultrasound.jpg/800px-Popliteal_vein_thrombosis_ultrasound.jpg",
  16: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Brachial_plexus_ultrasound_C5_C6_roots.png/800px-Brachial_plexus_ultrasound_C5_C6_roots.png",
  19: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Soft_tissue_abscess_ultrasound.png/800px-Soft_tissue_abscess_ultrasound.png",
  20: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Ultrasound_gestational_sac.png/800px-Ultrasound_gestational_sac.png",
  21: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Ectopic_pregnancy_ultrasound.png/800px-Ectopic_pregnancy_ultrasound.png",
  22: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Retinal_detachment_ultrasound.jpg/800px-Retinal_detachment_ultrasound.jpg",
  23: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Optic_nerve_sheath_dilation_ultrasound.png/800px-Optic_nerve_sheath_dilation_ultrasound.png",
  29: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/In_plane_needle_ultrasound.png/800px-In_plane_needle_ultrasound.png",
  31: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Popliteal_sciatic_ultrasound.png/800px-Popliteal_sciatic_ultrasound.png",
  33: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/A4C_RV_dilation.png/800px-A4C_RV_dilation.png",
  35: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Lung_point_static_ultrasound.png/800px-Lung_point_static_ultrasound.png"
};

// Exit if no URL for this card
if (!cardUrls[targetCardId]) {
  console.error(`No URL found for card ID ${targetCardId}`);
  process.exit(1);
}

// Original and alternative URLs
const originalUrl = cardUrls[targetCardId];
const alternativeUrl = alternativeUrls[targetCardId] || null;

// Get filename from URL
function getFilenameFromUrl(url) {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  const filename = pathParts[pathParts.length - 1];
  return decodeURIComponent(filename);
}

// Function to determine file extension from URL
function getFileExtension(url) {
  const filename = getFilenameFromUrl(url);
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

// Function to sanitize filename
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// Download an image with detailed debugging
function downloadWithHttps(url, savePath) {
  return new Promise((resolve, reject) => {
    console.log(`\n📥 Downloading: ${url}`);
    console.log(`📂 Saving to: ${savePath}`);
    
    // Determine if http or https
    const client = url.startsWith('https') ? https : http;
    
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://commons.wikimedia.org/',
        'Cache-Control': 'no-cache'
      }
    };
    
    // Make request
    const req = client.get(url, options, (res) => {
      // Debug response info
      console.log(`\n🔍 Response Info:`)
      console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`Content-Type: ${res.headers['content-type'] || 'unknown'}`);
      console.log(`Content-Length: ${res.headers['content-length'] || 'unknown'} bytes`);
      
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log(`↪️ Following redirect to: ${res.headers.location}`);
        downloadWithHttps(res.headers.location, savePath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      // Check if response is OK
      if (res.statusCode !== 200) {
        console.error(`❌ HTTP Error: ${res.statusCode} ${res.statusMessage}`);
        
        // Save error response for debugging
        const errorSavePath = `${savePath}.error.html`;
        const errorFile = fs.createWriteStream(errorSavePath);
        
        console.log(`💾 Saving error response to: ${errorSavePath}`);
        
        res.pipe(errorFile);
        
        errorFile.on('finish', () => {
          errorFile.close();
          reject(new Error(`HTTP Error: ${res.statusCode}`));
        });
        
        return;
      }
      
      // Check content type
      const contentType = res.headers['content-type'] || '';
      if (!contentType.includes('image/')) {
        console.warn(`⚠️ Warning: Response is not an image (${contentType})`);
      }
      
      // Create file stream and pipe response
      const file = fs.createWriteStream(savePath);
      res.pipe(file);
      
      // Handle file completion
      file.on('finish', () => {
        file.close();
        
        // Check file size
        const stats = fs.statSync(savePath);
        console.log(`✅ Download complete: ${stats.size} bytes`);
        
        if (stats.size < 5000) {
          console.warn(`⚠️ Warning: File is small (${stats.size} bytes)`);
        }
        
        // Check file type
        try {
          const fileTypeOutput = execSync(`file ${savePath}`).toString();
          console.log(`🔎 File type: ${fileTypeOutput.split(':')[1].trim()}`);
          
          if (fileTypeOutput.includes('HTML') || fileTypeOutput.includes('text')) {
            console.warn('⚠️ Warning: File appears to be HTML/text, not an image');
          }
        } catch (err) {
          console.error(`❌ Error checking file type: ${err.message}`);
        }
        
        resolve({
          success: true,
          size: stats.size,
          path: savePath
        });
      });
      
      // Handle error
      file.on('error', (err) => {
        fs.unlink(savePath, () => {});
        console.error(`❌ Error writing file: ${err.message}`);
        reject(err);
      });
    });
    
    // Handle request error
    req.on('error', (err) => {
      console.error(`❌ Request error: ${err.message}`);
      reject(err);
    });
    
    // Set timeout
    req.setTimeout(30000, () => {
      req.destroy();
      console.error('❌ Request timed out');
      reject(new Error('Request timed out'));
    });
  });
}

// Generate paths for saving files
const originalFilename = getFilenameFromUrl(originalUrl);
const ext = getFileExtension(originalUrl);
const sanitizedName = sanitizeFilename(originalFilename);

// Create save paths
const originalSavePath = path.join(localPath, `${targetCardId}_${sanitizedName}`);
const finalDestPath = path.join(__dirname, `../images/cards/local/${targetCardId}_target_${sanitizedName}`);

// Ensure directory exists
if (!fs.existsSync(path.dirname(finalDestPath))) {
  fs.mkdirSync(path.dirname(finalDestPath), { recursive: true });
}

// Main function
async function main() {
  console.log(`🔍 Processing Card ID: ${targetCardId}`);
  
  try {
    // Try original URL first
    console.log(`\n🔗 Trying original URL:`);
    const result1 = await downloadWithHttps(originalUrl, originalSavePath);
    
    if (result1.success && result1.size > 5000) {
      console.log('\n✅ Successfully downloaded from original URL!');
      
      // Copy to final destination
      fs.copyFileSync(originalSavePath, finalDestPath);
      console.log(`📋 Copied to: ${finalDestPath}`);
      
      return;
    }
    
    // If we have an alternative URL, try it
    if (alternativeUrl) {
      console.log(`\n🔗 Trying alternative URL:`);
      const alternativeSavePath = path.join(localPath, `${targetCardId}_alt_${sanitizedName}`);
      
      const result2 = await downloadWithHttps(alternativeUrl, alternativeSavePath);
      
      if (result2.success && result2.size > 5000) {
        console.log('\n✅ Successfully downloaded from alternative URL!');
        
        // Copy to final destination
        fs.copyFileSync(alternativeSavePath, finalDestPath);
        console.log(`📋 Copied to: ${finalDestPath}`);
        
        return;
      }
    }
    
    // Try with curl as last resort
    console.log(`\n🔗 Trying curl as fallback:`);
    
    try {
      const curlSavePath = path.join(localPath, `${targetCardId}_curl_${sanitizedName}`);
      const curlCommand = `curl -s -L -A "Mozilla/5.0" -o "${curlSavePath}" "${originalUrl}"`;
      
      console.log(`🧪 Running: ${curlCommand}`);
      execSync(curlCommand);
      
      // Check if file was created and is valid
      if (fs.existsSync(curlSavePath)) {
        const stats = fs.statSync(curlSavePath);
        console.log(`📊 File size: ${stats.size} bytes`);
        
        if (stats.size > 5000) {
          console.log('✅ Successfully downloaded with curl!');
          
          // Copy to final destination
          fs.copyFileSync(curlSavePath, finalDestPath);
          console.log(`📋 Copied to: ${finalDestPath}`);
          
          return;
        } else {
          console.error('❌ Curl download too small');
        }
      }
    } catch (err) {
      console.error(`❌ Curl error: ${err.message}`);
    }
    
    console.error('\n❌ All download methods failed');
    
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
  }
}

// Run the main function
main(); 