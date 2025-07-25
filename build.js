#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Building Stranger Things AR Game for production...');

// Create dist directory
const distDir = 'dist';
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Directories to copy
const directoriesToCopy = [
  'css',
  'js', 
  'assets',
  'sounds',
  'src',
  'fonts'
];

// Files to copy
const filesToCopy = [
  'index.html',
  'manifest.json',
  'sw.js',
  '.nojekyll'
];

// Copy directories
directoriesToCopy.forEach(dir => {
  if (fs.existsSync(dir)) {
    copyDirectory(dir, path.join(distDir, dir));
    console.log(`✅ Copied ${dir}/`);
  } else {
    console.log(`⚠️  Directory ${dir}/ not found, skipping...`);
  }
});

// Copy files
filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(distDir, file));
    console.log(`✅ Copied ${file}`);
  } else {
    console.log(`⚠️  File ${file} not found, skipping...`);
  }
});

// Create icons directory and placeholder icons for PWA
const iconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder SVG icons (in production, you'd use actual PNG icons)
const createPlaceholderIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${size/8}" fill="#ff6b6b" text-anchor="middle" dy=".3em">ST</text>
</svg>`;
};

// Generate placeholder icons
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.svg'), createPlaceholderIcon(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.svg'), createPlaceholderIcon(512));

console.log('✅ Created placeholder PWA icons');

// Update manifest.json to use SVG icons for now
const manifestPath = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.icons = [
    {
      "src": "icons/icon-192x192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512x512.svg", 
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ];
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Updated manifest.json with SVG icons');
}

// Optimize Service Worker for production
const swPath = path.join(distDir, 'sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Update cache name with timestamp for cache busting
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  swContent = swContent.replace(
    "const CACHE_NAME = 'stranger-things-ar-v1';",
    `const CACHE_NAME = 'stranger-things-ar-v1-${timestamp}';`
  );
  
  fs.writeFileSync(swPath, swContent);
  console.log('✅ Optimized Service Worker with cache busting');
}

console.log('🎉 Build completed successfully!');
console.log(`📁 Production files are in the ${distDir}/ directory`);

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}