const fs = require('fs');
const path = require('path');

console.log('CWD:', process.cwd());

const indexPath = path.join(process.cwd(), 'src/data/municipios_index.json');
const geoCandidates = [
    path.join(process.cwd(), 'src/data/adm2.json'),
    path.join(process.cwd(), 'public/data/adm2.geojson'),
    path.join(process.cwd(), 'dist-offline/data/adm2.geojson'),
];
const geoPath = geoCandidates.find((candidate) => fs.existsSync(candidate));
const knownMissingGeoCodes = new Set([
    '09005', // San Victor
    '16002', // Oviedo
    '17003', // Matanzas
    '25010', // Baitoa
]);

console.log('Index Path:', indexPath);
console.log('Geo Path:', geoPath || '(not found)');

if (!fs.existsSync(indexPath)) {
    console.error('ERROR: Index file not found');
    process.exit(1);
}
if (!geoPath) {
    console.error('ERROR: Geo file not found');
    console.error('Checked:', geoCandidates);
    process.exit(1);
}

try {
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const geoData = JSON.parse(fs.readFileSync(geoPath, 'utf8'));

    console.log(`Index items: ${indexData.length}`);
    console.log(`GeoJSON features: ${geoData.features.length}`);

    const indexIds = new Set(indexData.map(m => m.adm2_code));
    const geoIds = new Set(geoData.features.map(f => f.properties.adm2_code));

    const missingInGeo = [...indexIds].filter(id => !geoIds.has(id));
    const missingInIndex = [...geoIds].filter(id => !indexIds.has(id));

    console.log('Missing in GeoJSON:', missingInGeo);
    console.log('Missing in Index:', missingInIndex);

    const unexpectedMissingInGeo = missingInGeo.filter((id) => !knownMissingGeoCodes.has(id));
    if (missingInGeo.length) {
        console.warn('Known GeoJSON gaps:', missingInGeo.filter((id) => knownMissingGeoCodes.has(id)));
    }
    if (unexpectedMissingInGeo.length || missingInIndex.length || process.env.STRICT_GEO === '1') {
        process.exitCode = 1;
    }

    // Check for type mismatches (e.g. number vs string)
    const geoTypes = new Set(geoData.features.map(f => typeof f.properties.adm2_code));
    console.log('GeoJSON adm2_code types:', [...geoTypes]);

    const indexTypes = new Set(indexData.map(m => typeof m.adm2_code));
    console.log('Index adm2_code types:', [...indexTypes]);

} catch (e) {
    console.error('Error parsing files:', e);
    process.exit(1);
}
