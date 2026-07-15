const fs = require('fs');
const content = fs.readFileSync('c:/website/tp/app/(user)/profile/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('welcome') || line.toLowerCase().includes('login') || line.toLowerCase().includes('active') || line.toLowerCase().includes('morning')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
