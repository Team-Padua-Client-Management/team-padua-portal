const fs = require('fs');
const content = fs.readFileSync('c:/website/tp/app/(admin)/admin/profile/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  const l = line.toLowerCase();
  if (l.includes('morning') || l.includes('afternoon') || l.includes('evening') || l.includes('night') || l.includes('active') || l.includes('welcome')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
