#!/usr/bin/env node

/**
 * Script para testar funcionamento em produção
 * Verifica se todos os assets estão acessíveis e se a PWA está configurada corretamente
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing production build...');

const distDir = 'dist';
let errors = [];
let warnings = [];

// Verificar se o diretório dist existe
if (!fs.existsSync(distDir)) {
  errors.push('❌ Dist directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Arquivos essenciais que devem existir
const essentialFiles = [
  'index.html',
  'manifest.json',
  'sw.js',
  'css/style.css',
  'js/app.js',
  'js/game.js',
  'js/game-state.js',
  'js/utils.js',
  'js/audio-manager.js',
  'js/location-manager.js',
  'js/ar-manager.js',
  'js/mission-manager.js',
  'js/permission-handler.js'
];

// Verificar arquivos essenciais
console.log('📁 Checking essential files...');
essentialFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    errors.push(`❌ Missing essential file: ${file}`);
  }
});

// Verificar manifest.json
console.log('📱 Checking PWA manifest...');
const manifestPath = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Verificações do manifest
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    requiredFields.forEach(field => {
      if (manifest[field]) {
        console.log(`✅ Manifest has ${field}`);
      } else {
        errors.push(`❌ Manifest missing required field: ${field}`);
      }
    });
    
    // Verificar ícones
    if (manifest.icons && manifest.icons.length > 0) {
      manifest.icons.forEach(icon => {
        const iconPath = path.join(distDir, icon.src);
        if (fs.existsSync(iconPath)) {
          console.log(`✅ Icon exists: ${icon.src} (${icon.sizes})`);
        } else {
          warnings.push(`⚠️  Icon file not found: ${icon.src}`);
        }
      });
    }
    
    // Verificar se start_url e scope são relativos (para GitHub Pages)
    if (manifest.start_url.startsWith('./')) {
      console.log('✅ Manifest start_url is relative (GitHub Pages compatible)');
    } else {
      warnings.push('⚠️  Manifest start_url should be relative for GitHub Pages');
    }
    
  } catch (error) {
    errors.push(`❌ Invalid manifest.json: ${error.message}`);
  }
}

// Verificar Service Worker
console.log('⚙️  Checking Service Worker...');
const swPath = path.join(distDir, 'sw.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Verificar se tem cache name único (cache busting)
  if (swContent.includes('stranger-things-ar-v1-')) {
    console.log('✅ Service Worker has cache busting');
  } else {
    warnings.push('⚠️  Service Worker should have cache busting for production');
  }
  
  // Verificar se usa paths relativos
  if (swContent.includes('./')) {
    console.log('✅ Service Worker uses relative paths');
  } else {
    warnings.push('⚠️  Service Worker should use relative paths for GitHub Pages');
  }
  
  // Verificar se tem assets essenciais no cache
  if (swContent.includes('ESSENTIAL_ASSETS') && swContent.includes('MEDIA_ASSETS')) {
    console.log('✅ Service Worker has asset caching configured');
  } else {
    errors.push('❌ Service Worker missing asset caching configuration');
  }
}

// Verificar estrutura de diretórios
console.log('📂 Checking directory structure...');
const expectedDirs = ['css', 'js', 'assets', 'sounds', 'fonts'];
expectedDirs.forEach(dir => {
  const dirPath = path.join(distDir, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`✅ Directory exists: ${dir}/`);
  } else {
    warnings.push(`⚠️  Directory not found: ${dir}/`);
  }
});

// Verificar assets de mídia críticos
console.log('🎵 Checking critical media assets...');
const criticalAssets = [
  'assets/img/dustin-call.png',
  'sounds/call/dustin-intro.wav',
  'fonts/stranger-things.ttf'
];

criticalAssets.forEach(asset => {
  const assetPath = path.join(distDir, asset);
  if (fs.existsSync(assetPath)) {
    console.log(`✅ Critical asset: ${asset}`);
  } else {
    warnings.push(`⚠️  Critical asset not found: ${asset}`);
  }
});

// Verificar se index.html referencia os arquivos corretamente
console.log('🔗 Checking HTML references...');
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  // Verificar se registra o Service Worker
  if (htmlContent.includes('serviceWorker') && htmlContent.includes('sw.js')) {
    console.log('✅ HTML registers Service Worker');
  } else {
    errors.push('❌ HTML should register Service Worker');
  }
  
  // Verificar se referencia o manifest
  if (htmlContent.includes('manifest.json')) {
    console.log('✅ HTML references manifest');
  } else {
    errors.push('❌ HTML should reference manifest.json');
  }
  
  // Verificar meta tags para PWA
  const requiredMetas = ['viewport', 'theme-color'];
  requiredMetas.forEach(meta => {
    if (htmlContent.includes(`name="${meta}"`) || htmlContent.includes(`name='${meta}'`)) {
      console.log(`✅ HTML has ${meta} meta tag`);
    } else {
      warnings.push(`⚠️  HTML should have ${meta} meta tag`);
    }
  });
}

// Relatório final
console.log('\n📊 Production Test Report');
console.log('========================');

if (errors.length === 0) {
  console.log('🎉 All critical tests passed!');
} else {
  console.log(`❌ ${errors.length} critical error(s) found:`);
  errors.forEach(error => console.log(`  ${error}`));
}

if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} warning(s):`);
  warnings.forEach(warning => console.log(`  ${warning}`));
}

console.log('\n🚀 Production Checklist:');
console.log('□ Deploy to GitHub Pages');
console.log('□ Test HTTPS functionality');
console.log('□ Test PWA installation');
console.log('□ Test offline functionality');
console.log('□ Test on Samsung S20 FE');
console.log('□ Test geolocation permissions');
console.log('□ Test camera permissions');
console.log('□ Test AR functionality');

// Exit with error code if there are critical errors
if (errors.length > 0) {
  process.exit(1);
} else {
  console.log('\n✅ Production build is ready for deployment!');
  process.exit(0);
}