const fs = require('fs');
const path = require('path');

const txtPath = path.join(__dirname, '../Censo2022/Contenido Censo2022.txt');
const sourceDir = path.join(__dirname, '../Censo2022');
const targetDir = path.join(__dirname, '../Censo2022/Archivos_Clasificados');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
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

            const sourcePath = path.join(sourceDir, filename);
            const targetPath = path.join(targetDir, newFilename);

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

console.log(`\n🎉 Terminado! Se han copiado y renombrado ${count} archivos a la carpeta 'Archivos_Clasificados'.`);
