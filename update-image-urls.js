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

// Find and fix syntax errors in the card data file
function fixCardDataSyntax() {
  let fixedContent = cardDataContent;
  
  // Fix double quotes within quotes
  fixedContent = fixedContent.replace(/remote_target_img:\s*"([^"]*?)""([^"]*?)"/g, 'remote_target_img: "$1$2"');
  
  // Fix missing quotes
  fixedContent = fixedContent.replace(/remote_target_img:\s*https:\/\/([^\s,]+)/g, 'remote_target_img: "https://$1"');
  
  // Fix missing commas after remote_target_img
  fixedContent = fixedContent.replace(/remote_target_img:\s*"([^"]+)"\s*\n\s*\{/g, 'remote_target_img: "$1",\n  {');
  
  // Remove incomplete remote_target_img tags
  fixedContent = fixedContent.replace(/remote_target_img:\s*""\s*,/g, 'remote_target_img: "",');
  
  if (fixedContent !== cardDataContent) {
    console.log('Fixed syntax errors in card-data.js');
    fs.writeFileSync(cardDataPath + '.fixed', fixedContent);
    cardDataContent = fixedContent;
  }
}

// Extract card IDs and URLs from the card data
function extractCardUrls() {
  const cards = [];
  
  // Match remote_target_img fields with proper quotes
  const regex = /id:\s*(\d+)[^]*?remote_target_img:\s*"([^"]+)"/g;
  let match;
  
  while ((match = regex.exec(cardDataContent)) !== null) {
    const id = parseInt(match[1]);
    let url = match[2];
    
    // Skip empty URLs
    if (!url || url === "" || url.includes('placeholder')) continue;
    
    // Basic validation
    if (url && url.startsWith('http')) {
      // Check if this card ID already exists
      if (!cards.some(card => card.id === id)) {
        cards.push({ id, url });
      }
    }
  }
  
  return cards;
}

// Check if a URL is accessible
async function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const req = protocol.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        resolve({
          status: res.statusCode,
          accessible: res.statusCode >= 200 && res.statusCode < 400
        });
      });
      
      req.on('error', () => {
        resolve({ status: 0, accessible: false });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0, accessible: false });
      });
      
      req.end();
    } catch (error) {
      resolve({ status: 0, accessible: false });
    }
  });
}

// Generate alternative URL for Wikimedia Commons
function generateAlternativeUrl(url) {
  // First try to fix commons.wikimedia.org URLs
  if (url.includes('commons.wikimedia.org/wiki/File:')) {
    const filename = url.split('File:')[1];
    if (filename) {
      const encoded = encodeURIComponent(filename);
      return `https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/${encoded}/800px-${encoded}`;
    }
  }
  
  // Fix upload.wikimedia.org URLs
  if (url.includes('upload.wikimedia.org/wikipedia/commons') && !url.includes('/thumb/')) {
    // Add thumb to the URL
    const parts = url.split('/wikipedia/commons/');
    if (parts.length === 2) {
      return `https://upload.wikimedia.org/wikipedia/commons/thumb/${parts[1]}/800px-${parts[1].split('/').pop()}`;
    }
  }
  
  // Handle Google redirect URLs
  if (url.includes('google.com/url')) {
    try {
      const urlObj = new URL(url);
      const directUrl = urlObj.searchParams.get('url');
      if (directUrl) {
        return directUrl;
      }
    } catch (e) {
      // If parsing fails, return original
    }
  }
  
  return null;
}

// Alternative URLs for specific cards
const alternativeSources = {
  3: [
    "https://www.ncbi.nlm.nih.gov/books/NBK563197/bin/bladder_ultrasound.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/17/Ultrasound_Scan_ND_0126112316_1129461.png"
  ],
  4: [
    "https://www.wikidoc.org/images/6/6a/Subcostal-4chamber-heart-400x300.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/91/Subcostal_view_of_heart.gif"
  ],
  5: [
    "https://prod-images-static.radiopaedia.org/images/42060906/d8220e9db92dcbe66e9226b936ad22.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6d/Echo_heart_parasternal_long_axis_%28CardioNetworks_ECHOpedia%29.jpg"
  ],
  7: [
    "https://www.ncbi.nlm.nih.gov/books/NBK470180/bin/IVC_Long_Axis.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/58/Inferior_vena_cava_ultrasound.gif"
  ],
  8: [
    "https://pocus101.b-cdn.net/wp-content/uploads/2020/10/A-lines-with-Lung-Sliding-Labeled.gif",
    "https://www.researchgate.net/profile/Luca-Saba-2/publication/328111272/figure/fig1/AS:680235089375232@1539200977100/Lung-ultrasonography-Time-motion-mode-showing-seashore-sign-of-normal-lung-Alternating.jpg"
  ],
  9: [
    "https://i0.wp.com/nephropocus.com/wp-content/uploads/2020/09/Twit-1.gif?fit=600%2C376&ssl=1",
    "https://www.researchgate.net/profile/Luna-Gargani/publication/313350920/figure/fig1/AS:668380259504147@1536366520222/A-lines-are-horizontal-reverberation-artifacts-arising-from-the-pleural-line-at-regular.jpg"
  ],
  12: [
    "https://images.squarespace-cdn.com/content/v1/605f41f52dd559450832dee6/02cc64c9-f51e-4242-b723-808c858c2683/2.png?format=750w",
    "https://upload.wikimedia.org/wikipedia/commons/e/e1/Aorta_transverse_ultrasound_normal.jpg"
  ],
  13: [
    "https://i.pinimg.com/474x/72/97/ca/7297ca07a86df3589b10c6059b48e106.jpg",
    "https://www.wikidoc.org/images/7/79/PSAX-AV.JPG"
  ],
  14: [
    "https://www.researchgate.net/publication/334892929/figure/fig4/AS:787447461990400@1564753513020/Ultrasound-image-for-infiltration-between-the-popliteal-artery-and-capsule-of-the.png",
    "https://upload.wikimedia.org/wikipedia/commons/c/c0/Popliteal_vessels_transverse_ultrasound_normal.jpg"
  ],
  15: [
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5RmZCMJX0fA6rgGw3s1PANmx4e-cdEcdGkw&s",
    "https://www.wikidoc.org/images/4/47/PSAX-MV.JPG"
  ],
  35: [
    "https://pocus101.b-cdn.net/wp-content/uploads/2023/03/Ultrasound-Guided-Central-Line-CVL-Collapsible-Internal-Jugular-Vein-IJ.gif",
    "https://upload.wikimedia.org/wikipedia/commons/c/c0/Ultrasound_guided_internal_jugular_vein_cannulation_transverse.jpg"
  ]
};

// Main function to check URLs and generate alternatives
async function checkAndFixUrls() {
  // Fix syntax errors first
  fixCardDataSyntax();
  
  // Extract cards
  const cards = extractCardUrls();
  console.log(`Found ${cards.length} cards with remote URLs`);
  
  const results = {
    valid: [],
    invalid: [],
    alternatives: []
  };
  
  for (const card of cards) {
    try {
      console.log(`Checking URL for card ${card.id}: ${card.url}`);
      const checkResult = await checkUrl(card.url);
      
      if (checkResult.accessible) {
        results.valid.push(card);
        console.log(`✅ URL for card ${card.id} is accessible`);
      } else {
        console.log(`❌ URL for card ${card.id} is NOT accessible (status: ${checkResult.status})`);
        results.invalid.push(card);
        
        // Generate alternative
        let alternativeFound = false;
        
        // First try the custom alternatives
        if (alternativeSources[card.id]) {
          for (const altUrl of alternativeSources[card.id]) {
            console.log(`Trying alternative URL for card ${card.id}: ${altUrl}`);
            const altCheckResult = await checkUrl(altUrl);
            
            if (altCheckResult.accessible) {
              results.alternatives.push({
                id: card.id,
                originalUrl: card.url,
                alternativeUrl: altUrl,
                source: 'custom'
              });
              
              alternativeFound = true;
              console.log(`✅ Alternative URL for card ${card.id} is accessible`);
              break;
            }
          }
        }
        
        // If no custom alternative worked, try to generate one
        if (!alternativeFound) {
          const alternativeUrl = generateAlternativeUrl(card.url);
          
          if (alternativeUrl) {
            console.log(`Generated alternative URL for card ${card.id}: ${alternativeUrl}`);
            const altCheckResult = await checkUrl(alternativeUrl);
            
            if (altCheckResult.accessible) {
              results.alternatives.push({
                id: card.id,
                originalUrl: card.url,
                alternativeUrl: alternativeUrl,
                source: 'generated'
              });
              
              console.log(`✅ Generated alternative URL for card ${card.id} is accessible`);
            } else {
              console.log(`❌ Generated alternative URL for card ${card.id} is NOT accessible`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error checking URL for card ${card.id}: ${error.message}`);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Write results to file
  const report = {
    totalCards: cards.length,
    validUrls: results.valid.length,
    invalidUrls: results.invalid.length,
    alternativesFound: results.alternatives.length,
    invalid: results.invalid,
    alternatives: results.alternatives
  };
  
  fs.writeFileSync('url-check-results.json', JSON.stringify(report, null, 2));
  console.log(`\nCheck complete. ${results.valid.length} valid URLs, ${results.invalid.length} invalid URLs, ${results.alternatives.length} alternatives found.`);
  
  // Create update script
  if (results.alternatives.length > 0) {
    generateUpdateScript(results.alternatives);
  }
}

// Generate a script to update the card-data.js file with alternatives
function generateUpdateScript(alternatives) {
  let updateContent = `// Update script generated on ${new Date().toISOString()}\n`;
  updateContent += `// This script will update ${alternatives.length} URLs in card-data.js\n\n`;
  updateContent += `const fs = require('fs');\n\n`;
  updateContent += `// Read the card data file\n`;
  updateContent += `const cardDataPath = './js/card-data.js';\n`;
  updateContent += `let cardDataContent = fs.readFileSync(cardDataPath, 'utf8');\n\n`;
  updateContent += `// Update URLs\n`;
  updateContent += `let updatedContent = cardDataContent;\n\n`;
  
  alternatives.forEach(alt => {
    updateContent += `// Update card ${alt.id}\n`;
    updateContent += `updatedContent = updatedContent.replace(\n`;
    updateContent += `  /id:\\s*${alt.id}[^]*?remote_target_img:\\s*"${escapeRegExp(alt.originalUrl)}"/,\n`;
    updateContent += `  match => match.replace(\n`;
    updateContent += `    /"${escapeRegExp(alt.originalUrl)}"/,\n`;
    updateContent += `    \`"${alt.alternativeUrl}"\`\n`;
    updateContent += `  )\n`;
    updateContent += `);\n\n`;
  });
  
  updateContent += `// Write updated content back to file\n`;
  updateContent += `fs.writeFileSync(cardDataPath + '.updated', updatedContent);\n`;
  updateContent += `console.log('Updated card-data.js with ${alternatives.length} alternative URLs');\n`;
  
  fs.writeFileSync('update-card-urls.js', updateContent);
  console.log(`Created update-card-urls.js script to update ${alternatives.length} URLs`);
}

// Helper function to escape special characters in RegExp
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Run the main function
checkAndFixUrls().catch(console.error); 