const fs = require('fs');
const path = require('path');

// Recursively traverse directory for files
function getFiles(dir, extension, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        getFiles(filePath, extension, fileList);
      }
    } else if (file.endsWith(extension)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// 1. Fix CSS Modules corrupted hover/active classes
function fixCssModule(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace class-hover: with class group-hover:
  content = content.replace(/([a-zA-Z0-9_-]+)-hover:/g, '$1 group-hover:');
  
  // Replace class-active: with class group-active:
  content = content.replace(/([a-zA-Z0-9_-]+)-active:/g, '$1 group-active:');

  // Replace class-focus: with class group-focus:
  content = content.replace(/([a-zA-Z0-9_-]+)-focus:/g, '$1 group-focus:');

  // Replace class-focus-visible: with class group-focus-visible:
  content = content.replace(/([a-zA-Z0-9_-]+)-focus-visible:/g, '$1 group-focus-visible:');

  // Additional cleanup: if we have "dark:-hover:" -> replace with "dark:group-hover:"
  content = content.replace(/dark:-hover:/g, 'dark:group-hover:');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Restored variants in CSS Module: ${filePath}`);
  }
}

// 2. Fix TSX syntax (missing closing braces in className template literals)
function fixTsxSyntax(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Find className={`...` where the closing } is missing
  // Match className={`...` followed by closing tag/quote/newline without }
  content = content.replace(/className=\{\s*`([^`]+)`(?!\s*\})/g, 'className={\`$1\`\}');

  // Remove duplicate "group group" classes
  content = content.replace(/\bgroup\s+group\b/g, 'group');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed syntax in TSX: ${filePath}`);
  }
}

// Executions
const rootDirs = [
  path.join(__dirname, '..', 'app'),
  path.join(__dirname, '..', 'components')
];

let cssFiles = [];
let tsxFiles = [];

for (const dir of rootDirs) {
  if (fs.existsSync(dir)) {
    getFiles(dir, '.module.css', cssFiles);
    getFiles(dir, '.tsx', tsxFiles);
  }
}

console.log(`Found ${cssFiles.length} CSS Modules and ${tsxFiles.length} TSX files.`);

console.log('Starting CSS Module fixes...');
cssFiles.forEach(file => fixCssModule(file));

console.log('Starting TSX syntax fixes...');
tsxFiles.forEach(file => fixTsxSyntax(file));

console.log('All fixes completed successfully!');
