// Update script generated on 2025-04-22T20:10:39.092Z
// This script will update 1 URLs in card-data.js

const fs = require('fs');

// Read the card data file
const cardDataPath = './js/card-data.js';
let cardDataContent = fs.readFileSync(cardDataPath, 'utf8');

// Update URLs
let updatedContent = cardDataContent;

// Update card 7
updatedContent = updatedContent.replace(
  /id:\s*7[^]*?remote_target_img:\s*"https://upload\.wikimedia\.org/wikipedia/commons/thumb/5/58/Inferior_vena_cava_ultrasound\.gif/640px-Inferior_vena_cava_ultrasound\.gif"/,
  match => match.replace(
    /"https://upload\.wikimedia\.org/wikipedia/commons/thumb/5/58/Inferior_vena_cava_ultrasound\.gif/640px-Inferior_vena_cava_ultrasound\.gif"/,
    `"https://upload.wikimedia.org/wikipedia/commons/5/58/Inferior_vena_cava_ultrasound.gif"`
  )
);

// Write updated content back to file
fs.writeFileSync(cardDataPath + '.updated', updatedContent);
console.log('Updated card-data.js with 1 alternative URLs');
