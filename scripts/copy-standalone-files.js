const fs = require('fs');
const path = require('path');

const srcStatic = path.join(__dirname, '.next', 'static');
const destStatic = path.join(__dirname, '.next', 'standalone', '.next', 'static');
const srcPublic = path.join(__dirname, 'public');
const destPublic = path.join(__dirname, '.next', 'standalone', 'public');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Source directory does not exist, skipping: ${src}`);
    return;
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied: ${srcPath} -> ${destPath}`);
      } catch (err) {
        console.error(`Failed to copy ${srcPath}:`, err.message);
      }
    }
  }
}

console.log('Copying static files...');
console.log(`Source static: ${srcStatic}`);
console.log(`Dest static: ${destStatic}`);
console.log(`Source public: ${srcPublic}`);
console.log(`Dest public: ${destPublic}`);

copyDir(srcStatic, destStatic);
copyDir(srcPublic, destPublic);
console.log('Done!');