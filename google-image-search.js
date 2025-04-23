const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const axios = require('axios');
const sharp = require('sharp');

// Read card data
const cardsData = JSON.parse(fs.readFileSync('cards.json', 'utf8'));

// Create directories if they don't exist
const imagesDir = path.join('.', 'images', 'cards', 'local');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Function to check if image already exists
function checkExistingFile(cardId) {
  const files = fs.readdirSync(imagesDir);
  const pattern = new RegExp(`^${cardId}_target\\.(jpg|png|gif|jpeg)$`);
  return files.find(file => pattern.test(file));
}

// Function to download image
async function downloadImage(url, filePath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Check if response is an image
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      console.log(`❌ Not an image: ${contentType}`);
      return false;
    }
    
    // Process and save the image
    await sharp(response.data)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .toFile(filePath);
    
    return true;
  } catch (error) {
    console.log(`❌ Download error: ${error.message}`);
    return false;
  }
}

// Function to search for images and download the first valid one
async function searchAndDownloadImage(cardId, cardName) {
  console.log(`Processing card ${cardId}: ${cardName}`);
  
  // Check for existing image
  const existingFile = checkExistingFile(cardId);
  if (existingFile) {
    console.log(`⏭️ File already exists for card ${cardId}: ${existingFile}`);
    return { success: true, filePath: path.join(imagesDir, existingFile) };
  }
  
  // Build search query
  const searchQuery = `ultrasound ${cardName}`;
  console.log(`Searching for: "${searchQuery}"`);
  
  // Launch browser
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // Navigate to Google Images
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&tbm=isch`, {
      waitUntil: 'networkidle2'
    });
    
    // Wait for images to load
    await page.waitForSelector('img', { timeout: 5000 });
    
    // Get image URLs
    const imageUrls = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images
        .filter(img => img.src && img.src.startsWith('http') && img.width > 100 && img.height > 100)
        .map(img => img.src);
    });
    
    if (imageUrls.length === 0) {
      console.log(`❌ No images found for card ${cardId}`);
      await browser.close();
      return { success: false };
    }
    
    // Try to download images (try first 5)
    const imagesToTry = imageUrls.slice(0, 5);
    for (let i = 0; i < imagesToTry.length; i++) {
      const url = imagesToTry[i];
      console.log(`Trying image ${i+1}/${imagesToTry.length}: ${url.substring(0, 100)}...`);
      
      // Determine file extension from content type or URL
      let ext = 'jpg';  // Default to jpg
      if (url.includes('.png')) ext = 'png';
      else if (url.includes('.gif')) ext = 'gif';
      
      const filePath = path.join(imagesDir, `${cardId}_target.${ext}`);
      
      const success = await downloadImage(url, filePath);
      if (success) {
        console.log(`✅ Successfully downloaded image for card ${cardId}`);
        await browser.close();
        return { success: true, filePath };
      }
    }
    
    console.log(`❌ Failed to download any images for card ${cardId}`);
    await browser.close();
    return { success: false };
    
  } catch (error) {
    console.log(`❌ Error processing card ${cardId}: ${error.message}`);
    await browser.close();
    return { success: false };
  }
}

// Main function
async function main() {
  console.log(`Found ${cardsData.length} cards`);
  console.log('Starting to process cards...');
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    failedCards: []
  };
  
  // Process cards
  for (const card of cardsData) {
    try {
      const { success, filePath } = await searchAndDownloadImage(card.id, card.name);
      
      if (success) {
        if (checkExistingFile(card.id)) {
          results.skipped++;
        } else {
          results.success++;
          // Update card with local path
          card.local_target_img = filePath ? path.relative('.', filePath) : null;
        }
      } else {
        results.failed++;
        results.failedCards.push({ id: card.id, name: card.name });
      }
    } catch (error) {
      console.log(`❌ Unhandled error for card ${card.id}: ${error.message}`);
      results.failed++;
      results.failedCards.push({ id: card.id, name: card.name });
    }
  }
  
  // Save updated card data
  fs.writeFileSync('cards.json', JSON.stringify(cardsData, null, 2));
  
  // Print summary
  console.log('\n=== Processing Summary ===');
  console.log(`✅ Successfully downloaded: ${results.success} images`);
  console.log(`❌ Failed to download: ${results.failed} images`);
  console.log(`⏭️ Skipped: ${results.skipped} images`);
  
  if (results.failedCards.length > 0) {
    console.log('\nFailed cards:');
    results.failedCards.forEach(card => {
      console.log(`Card ${card.id}: ${card.name}`);
    });
  }
  
  console.log('\nUpdated card data file with new image paths');
}

main().catch(console.error); 