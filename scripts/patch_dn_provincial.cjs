const fs = require('fs');
const path = require('path');

const DATA_DIRS = [
    path.join(__dirname, '../src/data'),
    path.join(__dirname, '../public/data'),
].filter((dir, index, dirs) => fs.existsSync(dir) && dirs.indexOf(dir) === index);

const DN_CODE = "01001";
const DN_PROVINCE = "Distrito Nacional";

if (!DATA_DIRS.length) {
    console.error('No data directories found. Expected src/data and/or public/data.');
    process.exit(1);
}

const syncMapFile = (dataDir, muniFile, provFile) => {
    console.log(`Syncing ${path.basename(dataDir)}/${muniFile} -> ${provFile}...`);
    const muniPath = path.join(dataDir, muniFile);
    const provPath = path.join(dataDir, provFile);

    if (!fs.existsSync(muniPath) || !fs.existsSync(provPath)) {
        console.warn(`Files missing: ${muniFile} or ${provFile}`);
        return;
    }

    const muniData = JSON.parse(fs.readFileSync(muniPath, 'utf8'));
    const provData = JSON.parse(fs.readFileSync(provPath, 'utf8'));

    // DN data from municipality
    const dnData = muniData[DN_CODE] || muniData[parseInt(DN_CODE)];
    if (!dnData) {
        console.warn(`No data found for ${DN_CODE} in ${muniFile}`);
        return;
    }

    // Find or create province entry
    let provIndex = provData.findIndex(p => p.provincia === DN_PROVINCE);
    const newEntry = {
        provincia: DN_PROVINCE,
        ...dnData
    };
    // Remove adm2 specific fields if they exist
    delete newEntry.adm2_code;
    delete newEntry.municipio;

    if (provIndex >= 0) {
        provData[provIndex] = { ...provData[provIndex], ...newEntry };
    } else {
        provData.push(newEntry);
    }

    fs.writeFileSync(provPath, JSON.stringify(provData, null, 2));
    console.log(`Updated ${DN_PROVINCE} in ${provFile}`);
};

const syncListFile = (dataDir, muniFile, provFile) => {
    console.log(`Syncing ${path.basename(dataDir)}/${muniFile} -> ${provFile}...`);
    const muniPath = path.join(dataDir, muniFile);
    const provPath = path.join(dataDir, provFile);

    if (!fs.existsSync(muniPath) || !fs.existsSync(provPath)) {
        console.warn(`Files missing: ${muniFile} or ${provFile}`);
        return;
    }

    const muniData = JSON.parse(fs.readFileSync(muniPath, 'utf8'));
    const provData = JSON.parse(fs.readFileSync(provPath, 'utf8'));

    // DN data from municipality list
    const dnRows = muniData.filter(r => String(r.adm2_code).padStart(5, '0') === DN_CODE);
    if (dnRows.length === 0) {
        console.warn(`No data found for ${DN_CODE} in ${muniFile}`);
        return;
    }

    // For education_nivel, it's multiple rows. For others usually one.
    // We replace the province entries with the municipality entries.
    const nonDnProvData = provData.filter(r => r.provincia !== DN_PROVINCE);
    
    const newDnProvData = dnRows.map(r => {
        const entry = { ...r, provincia: DN_PROVINCE };
        delete entry.adm2_code;
        delete entry.municipio;
        return entry;
    });

    const updatedProvData = [...nonDnProvData, ...newDnProvData];
    fs.writeFileSync(provPath, JSON.stringify(updatedProvData, null, 2));
    console.log(`Updated ${DN_PROVINCE} in ${provFile} (${newDnProvData.length} rows)`);
};

// Execute syncs
try {
    for (const dataDir of DATA_DIRS) {
        // Map-like files
        syncMapFile(dataDir, 'pyramids.json', 'pyramids_provincia.json');
        syncMapFile(dataDir, 'salud_establecimientos.json', 'salud_establecimientos_provincia.json');

        // List-like files
        syncListFile(dataDir, 'educacion.json', 'educacion_provincia.json');
        syncListFile(dataDir, 'tic.json', 'tic_provincia.json');
        syncListFile(dataDir, 'educacion_nivel.json', 'educacion_nivel_provincia.json');
        syncListFile(dataDir, 'condicion_vida.json', 'condicion_vida_provincia.json');
    }

    console.log('Distrito Nacional provincial data patch completed successfully.');
} catch (err) {
    console.error('Error during DN patch:', err);
    process.exit(1);
}
