import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Copy index.html to 404.html for GitHub Pages SPA routing
const indexHtml = path.join(rootDir, 'dist', 'index.html');
const notFoundHtml = path.join(rootDir, 'dist', '404.html');

try {
    if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, notFoundHtml);
        console.log(`✅ Copied dist/index.html to dist/404.html for SPA routing.`);
    } else {
        console.warn(`⚠️ dist/index.html not found. Skipping 404.html creation.`);
    }
} catch (err) {
    console.error(`❌ Error creating 404.html:`, err);
}

const src = path.join(rootDir, 'public', 'api');
const dest = path.join(rootDir, 'dist', 'api');

console.log(`Post-build: Copying API folder... (Disabled for GitHub Pages stability)`);

/*
if (fs.existsSync(src)) {
    try {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        // Use fs.cpSync for recursive copy (Node 16.7+)
        fs.cpSync(src, dest, { recursive: true });
        console.log(`✅ Copied public/api to dist/api successfully.`);
    } catch (err) {
        console.warn(`⚠️ Warning: Failed to copy public/api. This is expected if the folder is locked or permission is denied. Skipping. Details:`, err.message);
        // Do not fail the build for this
    }
} else {
    console.warn(`⚠️ Source directory public/api does not exist. Skipping copy.`);
}
*/
