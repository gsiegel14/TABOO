const fs = require('fs');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const path = require('path');

// Read the card data from the original file
const cardDataFile = fs.readFileSync('./js/card-data.js', 'utf8');

// Extract all URLs from the file
function extractUrls(content) {
  const urlRegex = /remote_target_img:\s*["'](.+?)["']/g;
  const matches = [];
  let match;
  
  while ((match = urlRegex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

// Extract card IDs
function extractCardIds(content) {
  const idRegex = /id:\s*(\d+)/g;
  const matches = [];
  let match;
  
  while ((match = idRegex.exec(content)) !== null) {
    matches.push(parseInt(match[1]));
  }
  
  return matches;
}

const urls = extractUrls(cardDataFile);
const ids = extractCardIds(cardDataFile);

// Create pairs of [id, url]
const cardData = ids.map((id, index) => {
  return {
    id,
    url: index < urls.length ? urls[index] : null
  };
});

// Common request options for all HTTP requests
function getRequestOptions(referer = 'https://commons.wikimedia.org/') {
  return {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Referer': referer
    }
  };
}

// Strategy 1: Direct download with proper headers
async function directDownload(url, dest, cardId) {
  console.log(`Strategy 1: Attempting direct download with headers for Card ${cardId}...`);
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;
      
      const options = {
        ...getRequestOptions(),
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search
      };
      
      const req = client.get(options, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log(`⏩ Following redirect to ${res.headers.location}`);
          directDownload(res.headers.location, dest, cardId).then(resolve);
          return;
        }
        
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.log(`Direct download failed, status: ${res.statusCode}`);
          resolve(false);
          return;
        }
        
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Card ${cardId}: Downloaded image to ${dest}`);
          resolve(true);
        });
        
        fileStream.on('error', (err) => {
          fs.unlink(dest, () => {});
          console.log(`Error writing file: ${err.message}`);
          resolve(false);
        });
      });
      
      req.on('error', (err) => {
        console.log(`Error downloading: ${err.message}`);
        resolve(false);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        console.log(`Download timeout`);
        resolve(false);
      });
      
      req.end();
    } catch (error) {
      console.log(`Invalid URL format: ${error.message}`);
      resolve(false);
    }
  });
}

// Strategy 2: Try to get the image via Wikimedia API if it's a Wikipedia URL
async function wikimediaAPIDownload(url, dest, cardId) {
  console.log(`Strategy 2: Attempting Wikimedia API download for Card ${cardId}...`);
  
  // Only try this strategy for wikimedia URLs
  if (!url.includes('wikipedia.org') && !url.includes('wikimedia.org')) {
    console.log(`Not a Wikimedia URL, skipping this strategy`);
    return false;
  }
  
  // Extract the filename from the URL
  const parsedUrl = new URL(url);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const filename = path.basename(pathname);
  
  // Build the API URL to get image info
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json`;
  
  try {
    const imageData = await fetchJSON(apiUrl);
    const pages = imageData.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    
    if (pageId && pageId !== '-1' && pages[pageId].imageinfo && pages[pageId].imageinfo.length > 0) {
      const directUrl = pages[pageId].imageinfo[0].url;
      console.log(`Found direct URL via API: ${directUrl}`);
      return await directDownload(directUrl, dest, cardId);
    } else {
      console.log(`Could not find image info through the API`);
      return false;
    }
  } catch (error) {
    console.log(`Error using Wikimedia API: ${error.message}`);
    return false;
  }
}

// Strategy 3: Try to use 'thumb' URL variant for Wikipedia images
async function thumbURLDownload(url, dest, cardId) {
  console.log(`Strategy 3: Attempting thumb URL variant for Card ${cardId}...`);
  
  // Only try this strategy for wikimedia URLs
  if (!url.includes('wikipedia.org') && !url.includes('wikimedia.org')) {
    console.log(`Not a Wikimedia URL, skipping this strategy`);
    return false;
  }
  
  try {
    // For Wikipedia URLs, try different variants
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    
    // Try to use the thumb variant
    if (!pathname.includes('/thumb/')) {
      const parts = pathname.split('/');
      const index = parts.findIndex(part => part === 'commons');
      
      if (index !== -1 && parts.length > index + 2) {
        // Insert 'thumb' into the path
        parts.splice(index + 2, 0, 'thumb');
        // Add a size suffix
        const newPathname = `${parts.join('/')}/800px-${path.basename(pathname)}`;
        const thumbUrl = `${parsedUrl.protocol}//${parsedUrl.host}${newPathname}`;
        
        console.log(`Trying thumb URL: ${thumbUrl}`);
        const success = await directDownload(thumbUrl, dest, cardId);
        if (success) return true;
      }
    }
    
    return false;
  } catch (error) {
    console.log(`Error with thumb URL variant: ${error.message}`);
    return false;
  }
}

// Strategy 4: Try to fetch from web.archive.org
async function archiveOrgDownload(url, dest, cardId) {
  console.log(`Strategy 4: Attempting web.archive.org for Card ${cardId}...`);
  
  try {
    const archiveUrl = `https://web.archive.org/web/0/${url}`;
    console.log(`Trying archive.org URL: ${archiveUrl}`);
    return await directDownload(archiveUrl, dest, cardId);
  } catch (error) {
    console.log(`Error with archive.org: ${error.message}`);
    return false;
  }
}

// Strategy 5: If all else fails, use a search API to find a similar image
async function searchAPIDownload(targetWord, dest, cardId) {
  console.log(`Strategy 5: Attempting search API for Card ${cardId} (${targetWord})...`);
  
  try {
    // Use Bing Image Search API (requires an API key in real implementation)
    // This is a placeholder - you'd need to implement with a real API
    console.log(`Search API not implemented in this demo`);
    return false;
  } catch (error) {
    console.log(`Error with search API: ${error.message}`);
    return false;
  }
}

// Helper function to download with multiple strategies
async function downloadWithStrategies(url, dest, cardId) {
  // Extract target word for search strategy
  const targetWordMatch = cardDataFile.match(new RegExp(`id:\\s*${cardId},[\\s\\S]*?targetWord:\\s*["'](.+?)["']`));
  const targetWord = targetWordMatch ? targetWordMatch[1] : null;
  
  // Try each strategy in order
  const success = 
    await directDownload(url, dest, cardId) ||
    await wikimediaAPIDownload(url, dest, cardId) ||
    await thumbURLDownload(url, dest, cardId) ||
    await archiveOrgDownload(url, dest, cardId);
    
  if (!success && targetWord) {
    return await searchAPIDownload(targetWord, dest, cardId);
  }
  
  return success;
}

// Helper function to fetch JSON from a URL
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      ...getRequestOptions(),
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
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Main function to download all images
async function downloadAllImages() {
  const imagesDir = './images/cards/local';
  
  // Ensure the directory exists
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  
  console.log(`Downloading images to ${imagesDir}...`);
  
  let downloadedCount = 0;
  let failedCount = 0;
  
  for (const card of cardData) {
    const { id, url } = card;
    
    if (!url) {
      console.error(`❌ Card ${id}: No URL to download from`);
      failedCount++;
      continue;
    }
    
    // Extract file extension from URL
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const extension = path.extname(pathname) || '.jpg';
    
    const localFilename = `${id}_target${extension}`;
    const localPath = path.join(imagesDir, localFilename);
    
    // Skip if file already exists
    if (fs.existsSync(localPath)) {
      console.log(`✅ Card ${id}: Image already exists (${localPath})`);
      downloadedCount++;
      continue;
    }
    
    console.log(`\n📥 Processing Card ${id}: ${url}`);
    const success = await downloadWithStrategies(url, localPath, id);
    
    if (success) {
      downloadedCount++;
    } else {
      console.error(`❌ Card ${id}: All download strategies failed!`);
      failedCount++;
    }
  }
  
  console.log('\n--- Final Download Summary ---');
  console.log(`Downloaded: ${downloadedCount}`);
  console.log(`Failed: ${failedCount}`);
}

// Start the download process
downloadAllImages().catch(console.error); 