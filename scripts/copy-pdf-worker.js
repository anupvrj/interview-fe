#!/usr/bin/env node
/**
 * Copy PDF.js Worker to Public Folder
 * 
 * This script copies the PDF.js worker file from node_modules to public
 * so it can be served statically and matches the installed version.
 * 
 * Run: node scripts/copy-pdf-worker.js
 * Or: npm run copy-pdf-worker
 */

const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const destPath = path.join(__dirname, '../public/pdf.worker.min.mjs');

try {
  if (fs.existsSync(sourcePath)) {
    // Ensure public directory exists
    const publicDir = path.dirname(destPath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    fs.copyFileSync(sourcePath, destPath);
    console.log('✅ PDF worker copied successfully');
    console.log(`   From: ${sourcePath}`);
    console.log(`   To: ${destPath}`);
  } else {
    console.warn('⚠️  PDF worker file not found in node_modules');
    console.warn(`   Expected at: ${sourcePath}`);
    console.warn('   Make sure pdfjs-dist is installed: npm install pdfjs-dist');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error copying PDF worker:', error.message);
  process.exit(1);
}

