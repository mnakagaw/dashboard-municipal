import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const src = path.join(rootDir, 'public', 'api');
const dest = path.join(rootDir, 'dist', 'api');

console.log(`Post-build: Copying ${src} to ${dest}...`);

if (fs.existsSync(src)) {
    try {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        // Use fs.cpSync for recursive copy (Node 16.7+)
        fs.cpSync(src, dest, { recursive: true });
        console.log(`✅ Copied public/api to dist/api successfully.`);
    } catch (err) {
        console.error(`❌ Error copying public/api:`, err);
        process.exit(1);
    }
} else {
    console.warn(`⚠️ Source directory ${src} does not exist. Skipping copy.`);
}
