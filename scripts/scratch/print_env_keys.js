const fs = require('fs');
const files = ['.env', '.env.local'];
files.forEach(f => {
  if (fs.existsSync(f)) {
    console.log('--- File:', f);
    const content = fs.readFileSync(f, 'utf-8');
    content.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts[0]) {
        console.log(parts[0].trim());
      }
    });
  }
});
