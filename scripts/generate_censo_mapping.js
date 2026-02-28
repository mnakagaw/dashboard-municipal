const fs = require('fs');
const path = require('path');

const txtPath = path.join(__dirname, '../Censo2022/Contenido Censo2022.txt');
const classifiedDir = path.join(__dirname, '../Censo2022/Archivos_Clasificados');
const outPath = path.join(__dirname, '../docs/CENSO_ARCHIVOS_MAPPING.md');

const content = fs.readFileSync(txtPath, 'utf8').split('\n');
let classified = [];
try {
    classified = fs.readdirSync(classifiedDir);
} catch (e) {
    console.warn("Directorio Archivos_Clasificados no encontrado.");
}

const map = {};
classified.forEach(f => {
    const id = f.split('_')[0];
    map[id] = f;
});

let md = '# Mapeo de Archivos del Censo 2022\n\n';
md += 'Esta tabla describe la relación entre los archivos de datos brutos del Censo 2022 descargados originalmente y sus versiones renombradas (limpias) que se encuentran en la carpeta `Censo2022/Archivos_Clasificados` para facilitar su uso y la legibilidad en sistemas Windows.\n\n';
md += '| ID | Título del Cuadro | Archivo Original | Archivo Clasificado (Limpio) |\n';
md += '|:--:|---|---|---|\n';

content.forEach(line => {
    if (/^\d+\t/.test(line)) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
            const id = parts[0].trim();
            const title = parts[1].trim();
            const original = parts[2].trim();
            const clasFile = map[id];

            const displayClas = clasFile ? `\`${clasFile}\`` : '*NO DISPONIBLE*';

            md += `| ${id} | ${title} | \`${original}\` | ${displayClas} |\n`;
        }
    }
});

fs.writeFileSync(outPath, md, 'utf8');
console.log('✅ Documento de mapeo generado exitosamente en:', outPath);
