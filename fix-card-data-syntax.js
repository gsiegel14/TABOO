const fs = require('fs');

// Read the card data file
const cardDataPath = './js/card-data.js';
const originalContent = fs.readFileSync(cardDataPath, 'utf8');

// Create a backup before modifying
const backupPath = './js/card-data.js.bak2';
fs.writeFileSync(backupPath, originalContent);
console.log(`Created backup at ${backupPath}`);

// Function to extract and fix a card object
function extractAndFixCard(content, index) {
  // Regular expression to find a card object (from id to the next card or array end)
  const regex = new RegExp(`\\{\\s*id:\\s*${index}[^{]*?((?=\\s*\\{\\s*id:)|(?=\\s*\\];))`, 's');
  const match = content.match(regex);
  
  if (!match) {
    return { found: false, content };
  }
  
  // Get the card object text
  let cardText = match[0];
  const originalCardText = cardText;
  
  // Fix common syntax issues
  
  // Fix string issues with quotes
  cardText = cardText.replace(/prompt:\s*"([^"]*?)(?<!")(,|\n)/g, 'prompt: "$1"$2');
  cardText = cardText.replace(/targetWord:\s*"([^"]*?)(?<!")(,|\n)/g, 'targetWord: "$1"$2');
  
  // Fix specific issues in card 1
  if (index === 1) {
    cardText = cardText.replace(/prompt: "In the upper right abdomen", place your/g, 
                             'prompt: "In the upper right abdomen, place your');
  }
  
  // Fix missing commas after remote_target_img
  cardText = cardText.replace(/remote_target_img:\s*"[^"]*"\s*\n\s*\}/g, match => match.replace(/"\s*\n/, '",\n'));
  
  // Fix missing commas after values
  cardText = cardText.replace(/\b(prompt|targetWord|target_img|probe_img|local_target_img|local_probe_img): "[^"]*"\s*\n\s*(?!(prompt|targetWord|target_img|probe_img|local_target_img|local_probe_img|tabooWords|remote_target_img|}|,))/g, 
                          match => match.replace(/"\s*\n/, '",\n'));
  
  // Replace cardText in content if it was modified
  if (cardText !== originalCardText) {
    content = content.replace(originalCardText, cardText);
    return { found: true, fixed: true, content };
  }
  
  return { found: true, fixed: false, content };
}

// Fix all cards
let content = originalContent;
let totalFixed = 0;

for (let i = 1; i <= 40; i++) { // Assuming there are fewer than 40 cards
  const result = extractAndFixCard(content, i);
  content = result.content;
  
  if (result.found && result.fixed) {
    totalFixed++;
    console.log(`Fixed card ${i}`);
  }
}

// Fix final array bracket
if (!content.trim().endsWith('];')) {
  content = content.replace(/\];\s*$/, '];\n');
}

// Fix double commas
content = content.replace(/,\s*,/g, ',');

// Remove trailing commas before closing brace
content = content.replace(/,\s*}/g, '\n}');

// Fix issues with cards 20, 30, etc. where there's a missing comma
content = content.replace(/remote_target_img: "[^"]+"\s*\n\s*\{/g, match => match.replace(/"\s*\n/, '",\n'));

// Fix common patterns in all content
// Fix extra closing braces
content = content.replace(/},\s*},/g, '},');

// Write the fixed content
fs.writeFileSync(cardDataPath, content);
console.log(`\nFixed ${totalFixed} cards`);

// Verify syntax by trying to parse the file
try {
  // Try to load the file and parse it
  const tempFilePath = './js/card-data-test.js';
  
  // Create a temporary copy with a module.exports
  const moduleContent = content.replace(/const tabooCards = /, 'module.exports = ');
  fs.writeFileSync(tempFilePath, moduleContent);
  
  // Try to require it
  try {
    require(tempFilePath);
    console.log('\n✅ Syntax check passed! Cards file successfully loaded.');
  } catch (e) {
    console.error('\n❌ Syntax error still present:', e.message);
  }
  
  // Clean up temp file
  fs.unlinkSync(tempFilePath);
} catch (e) {
  console.error('\n❌ Error verifying syntax:', e.message);
} 