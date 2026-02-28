const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../Censo2022/Archivos_Clasificados');

if (!fs.existsSync(targetDir)) {
    console.error("Directorio no encontrado.");
    process.exit(1);
}

const files = fs.readdirSync(targetDir);
let count = 0;

for (const file of files) {
    let newName = file;

    // 1. Sustituir "と" (y en japonés) por " y "
    newName = newName.replace(/と/g, ' y ');

    // 2. Eliminar comas
    newName = newName.replace(/,/g, '');

    // 3. Sustituir paréntesis full-width por normales
    newName = newName.replace(/（/g, '(').replace(/）/g, ')');

    // 4. Limpiar cualquier otro carácter japonés que pudiera haberse colado (opcional, pero con "と" suele bastar por el listado)
    // 5. Limpiar espacios dobles o triples que se hayan generado
    newName = newName.replace(/\s+/g, ' ').trim();

    // Renombrar si hubo cambios
    if (newName !== file) {
        const oldPath = path.join(targetDir, file);
        const newPath = path.join(targetDir, newName);

        try {
            fs.renameSync(oldPath, newPath);
            console.log(`✅ Renamed:\n  From: ${file}\n  To:   ${newName}\n`);
            count++;
        } catch (e) {
            console.error(`❌ Error renaming ${file}:`, e);
        }
    }
}

console.log(`🎉 Terminado! Se han limpiado los nombres de ${count} archivos.`);
