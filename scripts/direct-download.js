/**
 * Direct Image Downloader for Taboo Game
 * 
 * This script downloads ultrasound images from Wikimedia Commons URLs
 * and updates the card-data.js file with local paths.
 */

const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');
const path = require('path');

// Image data from the table
const cardsData = [
  {id: 1, prompt: "Trauma: show free fluid between liver & right kidney.", tabooWords: ["FAST", "Morison's", "RUQ", "Liver", "Kidney"], url: "https://upload.wikimedia.org/wikipedia/commons/f/fa/MorisonNoText.png"},
  {id: 2, prompt: "Trauma: LUQ view—spleen–kidney interface.", tabooWords: ["LUQ", "Spleen", "Kidney", "FAST"], url: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Splenorenal_recess_ultrasound.png"},
  {id: 3, prompt: "FAST pelvis: fluid pocket behind bladder.", tabooWords: ["Bladder", "Pelvis", "Douglas", "Fluid"], url: "https://upload.wikimedia.org/wikipedia/commons/8/80/Ultrasound_Scan_ND_0126112316_1129461.png"},
  {id: 4, prompt: "Subxiphoid: anechoic fluid encircling heart.", tabooWords: ["Pericardial", "Effusion", "Tamponade"], url: "https://upload.wikimedia.org/wikipedia/commons/a/a2/PericardialeffusionUS.PNG"},
  {id: 5, prompt: "Normal parasternal long‑axis view.", tabooWords: ["Parasternal", "Long", "Axis"], url: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Echo_heart_parasternal_long_axis_%28CardioNetworks_ECHOpedia%29.jpg"},
  {id: 6, prompt: "Apical four‑chamber window (all four chambers).", tabooWords: ["Apical", "Four", "Chamber"], url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Apical_4_chamber_view.png"},
  {id: 7, prompt: "IVC long axis—>50 % collapse.", tabooWords: ["IVC", "Collapse", "Volume"], url: "https://upload.wikimedia.org/wikipedia/commons/9/95/Inferior_vena_cava_ultrasound.gif"},
  {id: 8, prompt: "M‑mode \"barcode\" sign.", tabooWords: ["Pneumothorax", "Sliding", "Pleura"], url: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Barcode_sign_M_mode_pneumothorax.png"},
  {id: 9, prompt: "Diffuse B‑lines from pleura.", tabooWords: ["B‑lines", "Edema", "CHF"], url: "https://upload.wikimedia.org/wikipedia/commons/0/0c/B_lines_on_a_lung_ultrasound_of_a_patient_with_fibrosis.jpg"},
  {id: 10, prompt: "Pleural effusion—\"jelly‑fish\" lung.", tabooWords: ["Effusion", "Fluid", "Chest"], url: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Pleural_effusion_with_jellyfish_sign.png"},
  {id: 11, prompt: "Lung consolidation with air bronchograms.", tabooWords: ["Consolidation", "Bronchogram", "Pneumonia"], url: "https://upload.wikimedia.org/wikipedia/commons/2/25/Lung_ultrasound_pneumonia_consolidation.png"},
  {id: 12, prompt: "Transverse abdominal aortic aneurysm (≥ 5 cm).", tabooWords: ["Aorta", "AAA", "Dissection"], url: "https://upload.wikimedia.org/wikipedia/commons/e/ec/Ultrasonography_of_abdominal_aortic_aneurysm_in_axial_plane.jpg"},
  {id: 13, prompt: "Common femoral vein DVT—non‑compressible.", tabooWords: ["DVT", "Femoral", "Thrombus"], url: "https://upload.wikimedia.org/wikipedia/commons/6/63/Ultrasonography_of_deep_vein_thrombosis_of_the_femoral_vein_-annotated.jpg"},
  {id: 14, prompt: "Popliteal vein DVT (long axis).", tabooWords: ["Popliteal", "DVT", "Thrombus"], url: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Popliteal_vein_thrombosis_ultrasound.jpg"},
  {id: 15, prompt: "Femoral nerve block: nerve lateral to artery.", tabooWords: ["Femoral", "Groin", "Nerve"], url: "https://upload.wikimedia.org/wikipedia/commons/9/99/Fermoral_nerve_block.jpg"},
  {id: 16, prompt: "Interscalene block: plexus roots between scalenes.", tabooWords: ["Interscalene", "Plexus", "Roots"], url: "https://upload.wikimedia.org/wikipedia/commons/8/89/Brachial_plexus_ultrasound_C5_C6_roots.png"},
  {id: 17, prompt: "Adductor‑canal (saphenous) block.", tabooWords: ["Adductor", "Canal", "Saphenous"], url: "https://upload.wikimedia.org/wikipedia/commons/6/6d/Adductor_canal.png"},
  {id: 18, prompt: "Piriformis/sciatic injection view.", tabooWords: ["Piriformis", "Sciatic", "Block"], url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Piriformis_ultrasound_injection.png"},
  {id: 19, prompt: "Soft‑tissue abscess with posterior enhancement.", tabooWords: ["Abscess", "Pus", "Cellulitis"], url: "https://upload.wikimedia.org/wikipedia/commons/8/89/Soft_tissue_abscess_ultrasound.png"},
  {id: 20, prompt: "Early intra‑uterine pregnancy (gestational sac + yolk).", tabooWords: ["Pregnancy", "Gestational", "Uterus"], url: "https://upload.wikimedia.org/wikipedia/commons/5/59/Ultrasound_gestational_sac.png"},
  {id: 21, prompt: "Ectopic: empty uterus & pelvic fluid.", tabooWords: ["Ectopic", "Tubal", "Rupture"], url: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Ectopic_pregnancy_ultrasound.png"},
  {id: 22, prompt: "Retinal detachment—flapping membrane.", tabooWords: ["Retina", "Detach", "Eye"], url: "https://upload.wikimedia.org/wikipedia/commons/1/19/Retinal_detachment_ultrasound.jpg"},
  {id: 23, prompt: "Optic‑nerve sheath > 5 mm (ICP).", tabooWords: ["Optic", "Sheath", "Pressure"], url: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Optic_nerve_sheath_dilation_ultrasound.png"},
  {id: 24, prompt: "Gallstones with posterior shadow.", tabooWords: ["Gallbladder", "Stone", "GB"], url: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Ultrasound_of_gall_bladder_with_calculus.jpg"},
  {id: 25, prompt: "Moderate hydronephrosis (dilated calyces).", tabooWords: ["Hydronephrosis", "Obstruction"], url: "https://upload.wikimedia.org/wikipedia/commons/b/bb/Ultrasound_of_right_kidney_moderate_hydronephrosis.jpg"},
  {id: 26, prompt: "Renal stone + hydronephrosis.", tabooWords: ["Stone", "Renal", "Calculus"], url: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Ultrasound_of_nephronia_and_renal_stone_left_kidney.jpg"},
  {id: 27, prompt: "Ascites pocket for paracentesis.", tabooWords: ["Ascites", "Paracentesis", "Fluid"], url: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Ascites_ultrasound_2.JPG"},
  {id: 28, prompt: "Large pleural effusion (static).", tabooWords: ["Thoracentesis", "Effusion", "Drain"], url: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Pleural_effusion_2.jpg"},
  {id: 29, prompt: "In‑plane needle visualised to target.", tabooWords: ["Needle", "Guide", "Echogenic"], url: "https://upload.wikimedia.org/wikipedia/commons/3/3e/In_plane_needle_ultrasound.png"},
  {id: 30, prompt: "IJ short‑axis: vein & artery before cannulation.", tabooWords: ["Central", "Line", "Vein"], url: "https://upload.wikimedia.org/wikipedia/commons/2/28/Ultrasound_showing_right_IJV_narrowing_lower_neck_at_the_lower_neck_due_to_compression_by_adjacent_neck_mass.jpg"},
  {id: 31, prompt: "Popliteal sciatic bifurcation for block.", tabooWords: ["Sciatic", "Popliteal", "Block"], url: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Popliteal_sciatic_ultrasound.png"},
  {id: 32, prompt: "PLAX with large effusion & diastolic RV collapse.", tabooWords: ["RV", "Collapse", "PLAX"], url: "https://upload.wikimedia.org/wikipedia/commons/5/54/PLAX_Mmode.jpg"},
  {id: 33, prompt: "Apical 4‑chamber: RV dilation in PE.", tabooWords: ["McConnell", "PE", "RV"], url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/A4C_RV_dilation.png"},
  {id: 34, prompt: "RUSH exam diagram—pump, tank, pipes.", tabooWords: ["RUSH", "Shock", "Protocol"], url: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Focused_cardiac_ultrasound_views.svg"},
  {id: 35, prompt: "Lung point (transition of sliding).", tabooWords: ["Lung", "Point", "Sliding"], url: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Lung_point_static_ultrasound.png"}
];

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

// Evaluate the array content
const tabooCards = eval(tabooCardsMatch[1]);

// Copy placeholder image to use for failed downloads
const placeholderPath = path.join(__dirname, '../images/cards/placeholder.svg');
if (!fs.existsSync(placeholderPath)) {
    console.error('Placeholder image not found at ' + placeholderPath);
    process.exit(1);
}

// Track all download promises
const pendingDownloads = [];

// Process each card
cardsData.forEach((card) => {
    // Find matching card in existing data by ID
    const existingCard = tabooCards.find(c => c.id === card.id);
    
    if (!existingCard) {
        console.error(`Card ID ${card.id} not found in existing data`);
        return;
    }
    
    // Convert to Special:FilePath URL to bypass 403
    const originalUrlObj = new URL(card.url);
    const filename = decodeURIComponent(originalUrlObj.pathname.split('/').pop());
    const safeDownloadUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?download`;
    
    // Ensure the filename is valid and unique
    const safeFilename = `${card.id}_target_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Create full path for saving
    const savePath = path.join(localPath, safeFilename);
    
    // Local path relative to web root
    const localPathRelative = `images/cards/local/${safeFilename}`;
    
    // Update card data
    existingCard.prompt = card.prompt;
    existingCard.targetWord = getTargetWordFromPrompt(card.prompt);
    existingCard.tabooWords = card.tabooWords;
    existingCard.remote_target_img = card.url;
    existingCard.local_target_img = localPathRelative;
    existingCard.target_img = localPathRelative; // Make local path primary
    
    // Skip if the file already exists with sufficient size
    if (fs.existsSync(savePath)) {
        const stats = fs.statSync(savePath);
        if (stats.size > 5000) { // File exists and is larger than 5KB
            console.log(`✅ Already exists: ${savePath}`);
            return;
        } else {
            console.log(`⚠️ Existing file too small, redownloading: ${savePath}`);
        }
    }
    
    // Download the image with proper headers
    console.log(`Downloading ${safeDownloadUrl} to ${savePath}...`);
    
    const downloadPromise = new Promise((resolve, reject) => {
        // Try direct download first with curl
        downloadWithCurl(safeDownloadUrl, savePath, (success) => {
            if (success) {
                console.log(`✅ Downloaded: ${savePath}`);
                resolve();
            } else {
                // Try original URL as fallback
                console.log(`⚠️ Trying original URL: ${card.url}`);
                downloadWithCurl(card.url, savePath, (originalSuccess) => {
                    if (originalSuccess) {
                        console.log(`✅ Downloaded from original URL: ${savePath}`);
                        resolve();
                    } else {
                        // Try proxy as last resort
                        console.log(`⚠️ Trying proxy for: ${card.url}`);
                        let proxyUrl = `https://images.weserv.nl/?url=${card.url.replace(/^https?:\/\//, '')}`;
                        downloadWithCurl(proxyUrl, savePath, (proxySuccess) => {
                            if (proxySuccess) {
                                console.log(`✅ Downloaded via proxy: ${savePath}`);
                            } else {
                                console.log(`❌ All download methods failed. Using placeholder for ${safeFilename}`);
                                fs.copyFileSync(placeholderPath, savePath);
                            }
                            resolve();
                        });
                    }
                });
            }
        });
    });
    
    pendingDownloads.push(downloadPromise);
});

// Wait for all downloads to complete
Promise.all(pendingDownloads).then(() => {
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
    
    // Provide command to finalize changes
    console.log('\nTo finalize changes, run:');
    console.log('mv js/card-data.js.new js/card-data.js');
});

// Helper function to extract a target word from the prompt
function getTargetWordFromPrompt(prompt) {
    // Try to get the target word from the prompt - this is a simplified approach
    // For example: "Lung consolidation with air bronchograms." → "Consolidation"
    
    // List of common target words to extract
    const commonTargets = [
        "FAST", "LUQ", "Pelvic", "Tamponade", "PLAX", "Apical 4-chamber", "IVC", 
        "Pneumothorax", "B-lines", "Pleural effusion", "Consolidation", "AAA", 
        "Femoral DVT", "Popliteal DVT", "Femoral nerve block", "Interscalene block",
        "Adductor canal block", "Piriformis block", "Abscess", "IUP", "Ectopic pregnancy",
        "Retinal detachment", "ONSD", "Cholelithiasis", "Hydronephrosis", "Nephrolithiasis",
        "Paracentesis", "Thoracentesis", "In-plane technique", "Central line",
        "Popliteal block", "Cardiac tamponade", "RV strain", "RUSH protocol", "Lung point"
    ];
    
    // Try to find a match
    for (const target of commonTargets) {
        if (prompt.toLowerCase().includes(target.toLowerCase())) {
            return target;
        }
    }
    
    // Fall back to first part of prompt 
    return prompt.split(':')[0].trim();
}

// Use curl to download with proper headers and automatic redirect following
function downloadWithCurl(url, savePath, callback) {
    // Escape quotes in URL for shell safety
    const escapedUrl = url.replace(/'/g, "'\\''");
    
    // Create curl command with proper headers and redirects
    const curlCommand = `curl -s -L -o "${savePath}" `+
                        `--connect-timeout 15 ` +
                        `--retry 3 ` +
                        `--retry-delay 2 ` +
                        `-A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" ` +
                        `-H "Referer: https://commons.wikimedia.org/" ` +
                        `'${escapedUrl}'`;
    
    // Execute curl command
    exec(curlCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Curl error: ${error.message}`);
            callback(false);
            return;
        }
        
        // Check if file was created with sufficient size
        if (fs.existsSync(savePath)) {
            const stats = fs.statSync(savePath);
            if (stats.size > 1000) { // Consider success if file is bigger than 1KB
                callback(true);
                return;
            } else {
                console.error(`❌ Downloaded file too small (${stats.size} bytes)`);
                fs.unlinkSync(savePath);
                callback(false);
                return;
            }
        }
        
        callback(false);
    });
} 