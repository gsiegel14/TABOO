const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

// Setup local directory
const localPath = 'images/cards/local';
if (!fs.existsSync(localPath)) {
    fs.mkdirSync(localPath, { recursive: true });
}

// Import card data (using direct read since we're in Node)
const cardDataPath = path.join(__dirname, '../js/card-data.js');
const cardDataContent = fs.readFileSync(cardDataPath, 'utf8');
const tabooCardsMatch = cardDataContent.match(/const tabooCards = (\[[\s\S]*?\]);/);

if (!tabooCardsMatch) {
    console.error('Could not parse tabooCards from card-data.js');
    process.exit(1);
}

// Evaluate the array content in a safe way
const tabooCards = eval(tabooCardsMatch[1]);

// Track all downloads
const pendingDownloads = [];

// Copy placeholder image to use for failed downloads
const placeholderPath = path.join(__dirname, '../images/cards/placeholder.svg');
if (!fs.existsSync(placeholderPath)) {
    console.error('Placeholder image not found at ' + placeholderPath);
    process.exit(1);
}

// Process each card
tabooCards.forEach((card, index) => {
    ['target_img', 'probe_img'].forEach(imageType => {
        const url = card[imageType];
        if (!url) return;
        
        // Create a safe filename from the URL
        let filename = url.split('/').pop().split('?')[0];
        
        // Special case for Radiopaedia numeric IDs
        if (/radiopaedia\.org\/images\/\d+$/.test(url)) {
            filename = url.split('/').pop() + '.jpg';
        }
        
        // Ensure the filename is valid and unique
        filename = `${card.id}_${imageType.replace('_img', '')}_${filename}`;
        
        // Create full path for saving
        const savePath = path.join(localPath, filename);
        
        // Add local path fields and switch primary image source to local
        const localKey = 'local_' + imageType;
        const localPathRelative = `images/cards/local/${filename}`;
        // Preserve original remote URL for reference/debugging
        const remoteKey = 'remote_' + imageType;
        card[remoteKey] = url;

        // Set the local path
        card[localKey] = localPathRelative;

        // Make local image the primary source so the game uses offline assets first
        card[imageType] = localPathRelative;
        
        // Skip if already exists
        if (fs.existsSync(savePath)) {
            console.log(`✅ Already exists: ${savePath}`);
            return;
        }
        
        // Download the image
        console.log(`Downloading ${url} to ${savePath}...`);
        
        const downloadPromise = new Promise((resolve, reject) => {
            // Choose protocol based on URL
            const protocol = url.startsWith('https:') ? https : http;
            
            // Try direct download first
            protocol.get(url, (res) => {
                // Check if successful
                if (res.statusCode !== 200) {
                    console.log(`⚠️ Failed direct download (${res.statusCode}): ${url}`);
                    
                    // Try via proxy for failed downloads
                    let proxyUrl = url;
                    if (/radiopaedia\.org\/images\/\d+$/.test(url)) {
                        proxyUrl = url + '.jpg';
                    }
                    
                    // Strip protocol for proxy
                    const cleanUrl = proxyUrl.replace(/^https?:\/\//, '');
                    const weservUrl = `https://images.weserv.nl/?url=${cleanUrl}`;
                    
                    console.log(`Trying proxy: ${weservUrl}`);
                    
                    https.get(weservUrl, (proxyRes) => {
                        if (proxyRes.statusCode !== 200) {
                            console.log(`❌ Failed proxy download (${proxyRes.statusCode}): ${weservUrl}`);
                            console.log(`Using placeholder image for ${filename}`);
                            
                            // Use placeholder image as fallback
                            fs.copyFileSync(placeholderPath, savePath);
                            resolve();
                            return;
                        }
                        
                        const file = fs.createWriteStream(savePath);
                        proxyRes.pipe(file);
                        
                        file.on('finish', () => {
                            file.close();
                            console.log(`✅ Saved via proxy: ${savePath}`);
                            resolve();
                        });
                        
                        file.on('error', (err) => {
                            fs.unlink(savePath, () => {});
                            console.error(`❌ Error saving file: ${err.message}`);
                            
                            // Use placeholder image as fallback
                            fs.copyFileSync(placeholderPath, savePath);
                            console.log(`Used placeholder image for ${filename} after error`);
                            resolve();
                        });
                    }).on('error', (err) => {
                        console.error(`❌ Error downloading via proxy: ${err.message}`);
                        
                        // Use placeholder image as fallback
                        fs.copyFileSync(placeholderPath, savePath);
                        console.log(`Used placeholder image for ${filename} after proxy error`);
                        resolve();
                    });
                    
                    return;
                }
                
                // Direct download succeeded
                const file = fs.createWriteStream(savePath);
                res.pipe(file);
                
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ Saved: ${savePath}`);
                    resolve();
                });
                
                file.on('error', (err) => {
                    fs.unlink(savePath, () => {});
                    console.error(`❌ Error saving file: ${err.message}`);
                    
                    // Use placeholder image as fallback
                    fs.copyFileSync(placeholderPath, savePath);
                    console.log(`Used placeholder image for ${filename} after direct download error`);
                    resolve();
                });
            }).on('error', (err) => {
                console.error(`❌ Error downloading: ${err.message}`);
                
                // Use placeholder image as fallback
                fs.copyFileSync(placeholderPath, savePath);
                console.log(`Used placeholder image for ${filename} after error`);
                resolve();
            });
        });
        
        pendingDownloads.push(downloadPromise);
    });
});

// Wait for all downloads to complete
Promise.allSettled(pendingDownloads).then(() => {
    console.log('\nAll downloads completed. Updating card-data.js...');
    
    // Generate updated card data
    let updatedCardData = cardDataContent.replace(
        /const tabooCards = \[[\s\S]*?\];/, 
        `const tabooCards = ${JSON.stringify(tabooCards, null, 4)};`
    );
    
    // Write updated card data
    fs.writeFileSync(cardDataPath + '.new', updatedCardData, 'utf8');
    console.log(`✅ Updated card data saved to ${cardDataPath}.new`);
    console.log('Review the changes and rename the file if satisfied.');
}); 