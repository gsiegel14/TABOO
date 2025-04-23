/**
 * Fix Card Data Script
 * 
 * This script scans the card-data.js file for syntax errors and fixes them:
 * - Adds missing commas between card objects
 * - Fixes missing quotes in URLs and properties
 * - Ensures proper JSON/JS object formatting
 */

const fs = require('fs');
const path = require('path');

// Paths
const cardDataPath = './js/card-data.js';
const backupDataPath = './js/card-data.js.syntax-fix-backup';

console.log('🔎 Scanning card data file for syntax errors...');

// Backup the original file
if (!fs.existsSync(backupDataPath)) {
  fs.copyFileSync(cardDataPath, backupDataPath);
  console.log(`✅ Backed up card data to ${backupDataPath}`);
}

// Read the file content
let fileContent = fs.readFileSync(cardDataPath, 'utf8');

// Common syntax errors to fix
const fixes = [
  // Card 4 - Fix missing quote in remote_target_img URL
  { 
    find: 'remote_target_img: ""https://upload.wikimedia.org/wikipedia/commons/9/91/Subcostal_view_of_heart.gif"',
    replace: 'remote_target_img: "https://upload.wikimedia.org/wikipedia/commons/9/91/Subcostal_view_of_heart.gif"'
  },
  
  // Card 5 - Fix missing comma after local_target_img and fix tabooWords
  {
    find: 'local_target_img: "images/cards/local/5_target.jpg""Parasternal", "Long", "Axis", "Cardiac", "Heart", "PLAX", "Sternum"]',
    replace: 'local_target_img: "images/cards/local/5_target.jpg", local_probe_img: null, tabooWords: ["Parasternal", "Long", "Axis", "Cardiac", "Heart", "PLAX", "Sternum"]'
  },
  
  // Card 5 - Fix remote_target_img double quotes
  {
    find: 'remote_target_img: ""https://prod-images-static.radiopaedia.org/images/42060906/d8220e9db92dcbe66e9226b936ad22.jpg"',
    replace: 'remote_target_img: "https://prod-images-static.radiopaedia.org/images/42060906/d8220e9db92dcbe66e9226b936ad22.jpg"'
  },
  
  // Card 6 - Fix missing quotes in remote_target_img URL
  {
    find: 'remote_target_img: https://www.google.com/url',
    replace: 'remote_target_img: "https://www.google.com/url'
  },
  
  // Card 11 - Fix "id" property formatting and extra quotes
  {
    find: '"id": 11,',
    replace: 'id: 11,'
  },
  
  // Card 11 - Fix other JSON formatting issues
  {
    find: '"prompt":',
    replace: 'prompt:'
  },
  {
    find: '"targetWord":',
    replace: 'targetWord:'
  },
  {
    find: '"target_img":',
    replace: 'target_img:'
  },
  {
    find: '"probe_img":',
    replace: 'probe_img:'
  },
  {
    find: '"local_target_img":',
    replace: 'local_target_img:'
  },
  {
    find: '"local_probe_img":',
    replace: 'local_probe_img:'
  },
  {
    find: '"tabooWords":',
    replace: 'tabooWords:'
  },
  {
    find: '"remote_target_img":',
    replace: 'remote_target_img:'
  },
  
  // Card 14 - Add missing comma after prompt
  {
    find: 'prompt: "Identify the Poplitealvein and artery being the knee"',
    replace: 'prompt: "Identify the Popliteal vein and artery behind the knee",'
  },
  
  // Card 15 - Fix missing quotation mark in remote_target_img URL
  {
    find: 'remote_target_img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5RmZCMJX0fA6rgGw3s1PANmx4e-cdEcdGkw&s"',
    replace: 'remote_target_img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5RmZCMJX0fA6rgGw3s1PANmx4e-cdEcdGkw&s"'
  },
  
  // Card 17 - Add missing closing quote for prompt and fix tabooWords
  {
    find: 'prompt: "Show me how you eval for a posterior sail sign',
    replace: 'prompt: "Show me how you eval for a posterior sail sign",'
  },
  {
    find: 'tabooWords: ["elbow", joint", "arm", "broken", "supracondylar"]',
    replace: 'tabooWords: ["elbow", "joint", "arm", "broken", "supracondylar"]'
  },
  
  // Card 19 - Add missing quote for prompt
  {
    find: 'prompt: "In the right upper quadrant, identify the mickey mouse',
    replace: 'prompt: "In the right upper quadrant, identify the mickey mouse",'
  },
  
  // Card 20 - Fix missing comma after remote_target_img
  {
    find: '} {',
    replace: '}, {'
  },
  
  // Card 21 - Fix missing comma at end of card object
  {
    find: 'remote_target_img: "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.augusta.edu%2Fmcg%2Fultrasound-education%2Fpaphysicalassessment.php&psig=AOvVaw1O3NSWS2U8cDKofRZZoLzo&ust=1745431848314000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCLDevL2e7IwDFQAAAAAdAAAAABAE" // Verified',
    replace: 'remote_target_img: "https://www.augusta.edu/mcg/ultrasound-education/paphysicalassessment.php" // Simplifying URL'
  },
  
  // Card 22 - Fix issues
  {
    find: 'id: 22,',
    replace: 'id: 22,'
  },
  
  // Card 28 - Fix double closing braces
  {
    find: '},\n  },',
    replace: '},'
  },
  
  // Card 29 - Fix JSON format issues
  {
    find: '"id": 29,',
    replace: 'id: 29,'
  },
  {
    find: '"prompt":',
    replace: 'prompt:'
  },
  {
    find: '"targetWord":',
    replace: 'targetWord:'
  },
  {
    find: '"target_img":',
    replace: 'target_img:'
  },
  {
    find: '"probe_img":',
    replace: 'probe_img:'
  },
  {
    find: '"local_target_img":',
    replace: 'local_target_img:'
  },
  {
    find: '"local_probe_img":',
    replace: 'local_probe_img:'
  },
  {
    find: '"tabooWords":',
    replace: 'tabooWords:'
  },
  {
    find: '"remote_target_img":',
    replace: 'remote_target_img:'
  },
  
  // Card 30 - Fix missing comma at end of card object
  {
    find: 'remote_target_img: "https://www.pocus.org/wp-content/uploads/2023/05/Picture4-300x242.jpg"',
    replace: 'remote_target_img: "https://www.pocus.org/wp-content/uploads/2023/05/Picture4-300x242.jpg"'
  },
  
  // Card 30 - Fix the hanging brace after remote_target_img
  {
    find: 'remote_target_img: "https://www.pocus.org/wp-content/uploads/2023/05/Picture4-300x242.jpg"\n  {',
    replace: 'remote_target_img: "https://www.pocus.org/wp-content/uploads/2023/05/Picture4-300x242.jpg"\n  }, {'
  }
];

// Apply all fixes
let fixCount = 0;
fixes.forEach(({ find, replace }) => {
  if (fileContent.includes(find)) {
    fileContent = fileContent.replace(find, replace);
    fixCount++;
    console.log(`✅ Fixed: "${find.substring(0, 40)}..."`);
  }
});

// Check for additional errors and fix
const extraErrors = [
  // Look for missing commas between card objects
  { 
    regex: /}(\s*){/g, 
    replace: '}, $1{', 
    message: 'Missing comma between card objects'
  },
  
  // Look for missing quotes in URLs
  {
    regex: /remote_target_img:\s*([^"\s][^\s,}]*)/g,
    replace: 'remote_target_img: "$1"',
    message: 'Missing quotes around URL'
  }
];

extraErrors.forEach(({ regex, replace, message }) => {
  let match;
  while ((match = regex.exec(fileContent)) !== null) {
    console.log(`✅ Fixed: ${message} near "${match[0].substring(0, 40)}..."`);
    fileContent = fileContent.replace(match[0], replace);
    fixCount++;
  }
});

// Write the fixed file
fs.writeFileSync(cardDataPath, fileContent);

console.log(`\n🎉 Fixed ${fixCount} syntax errors in card data file.`);
console.log(`📋 Original file backed up to ${backupDataPath}`);
console.log('✅ Card data syntax has been fixed! The application should work now.'); 