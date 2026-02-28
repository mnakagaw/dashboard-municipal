const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '../data_sources');
const targetDir = path.join(baseDir, 'Datos_Originales_Censo2022');

// Crear la carpeta Datos_Originales_Censo2022 si no existe
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
}

// baseDir内のファイル一覧を取得
const files = fs.readdirSync(baseDir);
let count = 0;

for (const file of files) {
    const fullPath = path.join(baseDir, file);

    // Solo procesar archivos
    if (!fs.statSync(fullPath).isFile()) continue;

    const lowerFile = file.toLowerCase();

    // 1. Filtrar solo archivos de Excel (.xlsx, .xlsm, .xls)
    if (!lowerFile.endsWith('.xlsx') && !lowerFile.endsWith('.xlsm') && !lowerFile.endsWith('.xls')) {
        continue;
    }

    // 2. Exclusiones indicadas por el usuario (ignorando mayúsculas/minúsculas)
    if (lowerFile.includes('dee-2024') || lowerFile.includes('.geojson') || lowerFile.includes('.zip')) {
        continue;
    }

    // Mover archivo
    const targetPath = path.join(targetDir, file);
    fs.renameSync(fullPath, targetPath);
    console.log(`✅ Movido: ${file}`);
    count++;
}

console.log(`\n🎉 Terminado! Se han movido ${count} archivos Excel a la carpeta Datos_Originales_Censo2022.`);
