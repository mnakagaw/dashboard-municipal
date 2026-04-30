const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'src/data/municipios_index.json');
const geoCandidates = [
    path.join(process.cwd(), 'src/data/adm2.json'),
    path.join(process.cwd(), 'public/data/adm2.geojson'),
    path.join(process.cwd(), 'dist-offline/data/adm2.geojson'),
];
const geoPath = geoCandidates.find((candidate) => fs.existsSync(candidate));

if (!fs.existsSync(indexPath) || !geoPath) {
    console.error('Files not found');
    console.error('Geo candidates:', geoCandidates);
    process.exit(1);
}

const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const geoData = JSON.parse(fs.readFileSync(geoPath, 'utf8'));

// Map adm2_code to province for both
const indexProvinces = {};
indexData.forEach(m => {
    indexProvinces[m.adm2_code] = m.provincia;
});

const geoProvinces = {};
geoData.features.forEach(f => {
    geoProvinces[f.properties.adm2_code] = f.properties.provincia;
});

const mismatches = [];
const allCodes = new Set([...Object.keys(indexProvinces), ...Object.keys(geoProvinces)]);

allCodes.forEach(code => {
    const p1 = indexProvinces[code];
    const p2 = geoProvinces[code];
    if (p1 && p2 && p1 !== p2) {
        mismatches.push({ code, index: p1, geo: p2 });
    }
});

console.log('Total codes checked:', allCodes.size);
console.log('Mismatches found:', mismatches.length);
if (mismatches.length > 0) {
    console.log('First 5 mismatches:', mismatches.slice(0, 5));
    process.exitCode = 1;
} else {
    console.log('No province name mismatches found.');
}
