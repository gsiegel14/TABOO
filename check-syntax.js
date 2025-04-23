const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Path to the file to check
const filepath = './js/card-data.js';

console.log(`Checking syntax of ${filepath}...`);

try {
  // Read the file
  const content = fs.readFileSync(filepath, 'utf8');
  
  // Create a new context to avoid polluting the global scope
  const context = vm.createContext({});
  
  try {
    // Try to parse the script
    vm.runInContext(content, context);
    console.log('✅ Syntax is valid!');
  } catch (error) {
    console.error('❌ Syntax error:', error.message);
    
    // Extract line number from error stack trace
    const lineMatch = error.stack.match(/at (?:evalmachine.<anonymous>|<anonymous>):(\d+)/);
    if (lineMatch) {
      const lineNumber = parseInt(lineMatch[1], 10);
      console.error(`Error on line ${lineNumber}`);
      
      // Display the problematic lines
      const lines = content.split('\n');
      const start = Math.max(0, lineNumber - 5);
      const end = Math.min(lines.length, lineNumber + 5);
      
      console.log('\nContext:');
      for (let i = start; i < end; i++) {
        const lineIndicator = i + 1 === lineNumber ? '>> ' : '   ';
        console.log(`${lineIndicator}${i + 1}: ${lines[i]}`);
      }
    }
  }
} catch (error) {
  console.error(`Error reading file: ${error.message}`);
} 