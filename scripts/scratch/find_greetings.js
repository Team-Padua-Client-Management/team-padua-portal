const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git') && !file.includes('scratch') && !file.includes('dist')) {
        results = results.concat(walk(fullPath));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css') || file.endsWith('.json')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = walk('c:/website/tp');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.toLowerCase().includes('fully authorized') || content.toLowerCase().includes('authorized administrator') || content.toLowerCase().includes('good night') || content.toLowerCase().includes('active -')) {
    console.log(`${path.relative('c:/website/tp', file)}`);
  }
});
