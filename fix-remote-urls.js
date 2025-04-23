const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// File paths
const CARD_DATA_FILE = './js/card-data.js';
const BACKUP_FILE = './js/card-data.js.url-backup';

// Make a backup of the original file if not exists
if (!fs.existsSync(BACKUP_FILE)) {
  console.log(`Creating backup of card data at ${BACKUP_FILE}`);
  fs.copyFileSync(CARD_DATA_FILE, BACKUP_FILE);
}

// Read card data
const cardDataContent = fs.readFileSync(CARD_DATA_FILE, 'utf8');

// Alternative image sources to try when the main URL fails
const alternativeURLs = {
  // A-lines in lung ultrasound
  9: [
    "https://i0.wp.com/nephropocus.com/wp-content/uploads/2020/09/Twit-1.gif?fit=600%2C376&ssl=1",
    "https://www.researchgate.net/profile/Luna-Gargani/publication/313350920/figure/fig1/AS:668380259504147@1536366520222/A-lines-are-horizontal-reverberation-artifacts-arising-from-the-pleural-line-at-regular.jpg"
  ],
  // M-mode seashore sign
  8: [
    "https://pocus101.b-cdn.net/wp-content/uploads/2020/10/A-lines-with-Lung-Sliding-Labeled.gif",
    "https://www.researchgate.net/profile/Luca-Saba-2/publication/328111272/figure/fig1/AS:680235089375232@1539200977100/Lung-ultrasonography-Time-motion-mode-showing-seashore-sign-of-normal-lung-Alternating.jpg"
  ],
  // Parasternal long axis view
  5: [
    "https://prod-images-static.radiopaedia.org/images/42060906/d8220e9db92dcbe66e9226b936ad22.jpg",
    "https://123sonography.com/sites/default/files/2023-03/PLAX.png"
  ],
  // Apical 4-chamber view
  6: [
    "https://www.echocardia.com/images/apical4_1.jpg",
    "https://www.researchgate.net/profile/Annalisa-Vezzani/publication/322296515/figure/fig1/AS:682118986518530@1539654964078/Apical-four-chamber-view.jpg"
  ],
  // Additional alternatives for failing URLs
  14: [
    "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2019/nejm_2019.380.issue-8/nejmicm1809666/20190221/images/img_medium/nejmicm1809666_f1.jpeg",
    "https://www.ultrasoundcases.info/thumbs/5-98-1.jpg"
  ],
  16: [
    "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2009/nejm_2009.360.issue-15/nejmvcm0810156/production/images/img_medium/nejmvcm0810156_f1.jpeg",
    "https://www.nysora.com/wp-content/uploads/2019/06/Interscalene-Brachial-Plexus-Block-Ultrasound-Guided-Technique.jpg"
  ],
  20: [
    "https://www.ultrasoundcases.info/thumbs/4-53-1.jpg",
    "https://www.ncbi.nlm.nih.gov/pmc/articles/instance/4446915/bin/JMU-23-112-g001.jpg"
  ],
  24: [
    "https://www.ultrasoundcases.info/thumbs/5-43-1.jpg",
    "https://www.ncbi.nlm.nih.gov/pmc/articles/instance/4190822/bin/main-7-457-g003.jpg"
  ],
  26: [
    "https://www.ultrasoundcases.info/thumbs/5-53-1.jpg",
    "https://www.racgp.org.au/FSDEDEV/media/images/Clinical%20images/AFP/2018/April/Carotid-ultrasound.jpg"
  ],
  27: [
    "https://www.ultrasoundcases.info/thumbs/6-38-1.jpg",
    "https://www.ncbi.nlm.nih.gov/pmc/articles/instance/3445217/bin/CRIM.EM2012-679121.001.jpg"
  ],
  29: [
    "https://www.ncbi.nlm.nih.gov/pmc/articles/instance/5061176/bin/10-1055-s-0036-1587756-i1600090-3-2.jpg",
    "https://www.ultrasoundcases.info/thumbs/6-12-1.jpg"
  ],
  32: [
    "https://www.ultrasoundcases.info/thumbs/6-51-1.jpg",
    "https://www.ncbi.nlm.nih.gov/pmc/articles/instance/8166828/bin/41999_2021_981_Fig1_HTML.jpg"
  ],
  33: [
    "https://www.nejm.org/na101/home/literatum/publisher/mms/journals/content/nejm/2018/nejm_2018.379.issue-15/nejmicm1800108/20181011/images/img_xlarge/nejmicm1800108_f1.jpeg",
    "https://www.ultrasoundcases.info/thumbs/6-47-1.jpg"
  ],
  34: [
    "https://www.ultrasoundcases.info/thumbs/7-34-1.jpg",
    "https://www.ncbi.nlm.nih.gov/pmc/articles/instance/6440740/bin/cureus-0011-00000004399-i02.jpg"
  ],
  35: [
    "https://www.ncbi.nlm.nih.gov/pmc/articles/instance/6037332/bin/cureus-0010-00000002807-i01.jpg",
    "https://www.ultrasoundcases.info/thumbs/7-8-1.jpg"
  ]
};

// Extract card URLs and IDs using regex
const cardUrlRegex = /id:\s+(\d+),[\s\S]*?remote_target_img:\s+"([^"]+)"/g;
const cards = [];
let match;

while ((match = cardUrlRegex.exec(cardDataContent)) !== null) {
  const id = parseInt(match[1], 10);
  const url = match[2];
  if (url && url.startsWith('http')) {
    cards.push({ id, url, match: match[0] });
  }
}

console.log(`Found ${cards.length} cards with remote URLs.`);

// Check a URL and return whether it's working (200 status)
function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 5000,
        method: 'HEAD'  // Just check headers, don't download content
      };
      
      const req = protocol.request(url, options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({ url, status: res.statusCode, working: true });
        } else {
          resolve({ url, status: res.statusCode, working: false });
        }
      });
      
      req.on('error', (err) => {
        resolve({ url, status: 0, working: false, error: err.message });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ url, status: 0, working: false, error: 'Request timed out' });
      });
      
      req.end();
    } catch (err) {
      resolve({ url, status: 0, working: false, error: err.message });
    }
  });
}

// Main function
async function fixUrls() {
  console.log("Found", cards.length, "cards with remote URLs.");
  console.log("Checking remote URLs...");
  
  let updatedCount = 0;
  let contentCopy = cardDataContent;

  for (const card of cards) {
    const { id, url } = card;
    let statusMsg = '';
    let updatedUrl = '';
    
    try {
      const urlStatus = await checkUrl(url);
      if (urlStatus.working) {
        statusMsg = `✅ Card ${id}: URL is working (status: ${urlStatus.status})`;
      } else {
        // URL is not working, try alternatives
        if (alternativeURLs[id] && alternativeURLs[id].length > 0) {
          let foundWorking = false;
          
          for (const altUrl of alternativeURLs[id]) {
            const altStatus = await checkUrl(altUrl);
            if (altStatus.working) {
              statusMsg = `🔄 Card ${id}: Original URL not working (status: ${urlStatus.status}). Updated to working alternative`;
              updatedUrl = altUrl;
              foundWorking = true;
              
              // Replace the URL in the card data
              const cardRegex = new RegExp(`(id:\\s+${id},[\\s\\S]*?remote_target_img:\\s+)"([^"]+)"`, 'g');
              contentCopy = contentCopy.replace(cardRegex, `$1"${altUrl}"`);
              updatedCount++;
              break;
            }
          }
          
          if (!foundWorking) {
            statusMsg = `❌ Card ${id}: URL ${url} is not working (status: ${urlStatus.status}) and no working alternatives found`;
          }
        } else {
          statusMsg = `❌ Card ${id}: URL ${url} is not working (status: ${urlStatus.status}) and no alternatives available`;
        }
      }
    } catch (error) {
      statusMsg = `❌ Card ${id}: Error checking URL ${url}: ${error.message}`;
    }
    
    console.log(statusMsg);
  }
  
  // Write updated content back to file if changes were made
  if (updatedCount > 0) {
    fs.writeFileSync(CARD_DATA_FILE, contentCopy);
    console.log(`\n✅ Updated ${updatedCount} URLs in the card data file.`);
    console.log(`Original file backed up at ${BACKUP_FILE}`);
  } else {
    console.log(`\n⚠️ No URLs were updated.`);
  }
}

// Run the fix
fixUrls().catch(err => {
  console.error('Script error:', err);
}); 