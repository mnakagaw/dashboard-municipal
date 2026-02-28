const fs = require('fs');
const path = require('path');

const txtPath = path.join(__dirname, '../data_sources/Contenido Censo2022.txt');
const CENSO_DIR = path.join(__dirname, '../data_sources');
const OUTPUT_DIR = path.join(CENSO_DIR, 'Archivos_Clasificados_Censo2022');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

const content = fs.readFileSync(txtPath, 'utf8');
const lines = content.split('\n');

let count = 0;

for (const line of lines) {
    // 数字とタブで始まる行を探す (例: "1\tTítulo...\tarchivo.xlsx")
    if (/^\d+\t/.test(line)) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
            const id = parts[0].trim();
            const title = parts[1].trim();
            let filename = parts[2].trim();

            // Sanitize title (Windowsでファイル名に使えない文字を置換)
            let sanitizedTitle = title.replace(/[<>:"\/\\|?*]/g, '-');

            // 長すぎる場合は少し丸める（Windowsのパス長制限対策）
            if (sanitizedTitle.length > 100) {
                sanitizedTitle = sanitizedTitle.substring(0, 100) + '...';
            }

            // フォーマット: "ID_内容_元のファイル名"
            const newFilename = `${id}_${sanitizedTitle}_${filename}`;

            const sourcePath = path.join(CENSO_DIR, filename);
            const targetPath = path.join(OUTPUT_DIR, newFilename);

            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`✅ Copied: ${newFilename}`);
                count++;
            } else {
                console.warn(`⚠️ Warning: File not found: ${filename}`);
            }
        }
    }
}

console.log(`\n🎉 Terminado! Se han copiado y renombrado ${count} archivos a la carpeta 'Archivos_Clasificados_Censo2022'.`);
