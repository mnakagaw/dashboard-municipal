const fs = require("fs");

try {
    const tic = JSON.parse(fs.readFileSync("src/data/tic.json"));
    const ticProv = JSON.parse(fs.readFileSync("src/data/tic_provincia.json"));

    // Extracted from Cuadro 4 & 6 for Distrito Nacional
    const popTotal = 956569;
    const internetUsed = 824719; // from Cuadro 4 'Sí lo utilizó'
    const desktopUsed = 256383; // Cuadro 6
    const laptopUsed = 388233;  // Cuadro 6
    const computerUsed = desktopUsed + laptopUsed; // or just use laptop if you prefer, but sum is standard when not deduplicated
    const cellularUsed = 801016; // Cuadro 6 smartphone

    const newMunEntry = {
        adm2_code: "01001", // matching string or number? in tic.json some are int, some string. Let's check: most are numbers, let's use string to match pyramids or 01001 if possible. Wait, others are 32001 (int). So let's use "01001" to be safe since it starts with 0.
        municipio: "Santo Domingo de Guzmán",
        internet: {
            municipio: "Santo Domingo de Guzmán",
            total: popTotal,
            used: internetUsed,
            rate_used: internetUsed / popTotal
        },
        cellular: {
            municipio: "Santo Domingo de Guzmán",
            total: popTotal,
            used: cellularUsed,
            rate_used: cellularUsed / popTotal
        },
        computer: {
            municipio: "Santo Domingo de Guzmán",
            total: popTotal,
            used: computerUsed,
            rate_used: computerUsed / popTotal
        }
    };

    const existingMunIdx = tic.findIndex(e => e.adm2_code == "01001" || String(e.adm2_code) == "1001");
    if (existingMunIdx !== -1) {
        tic[existingMunIdx] = newMunEntry;
    } else {
        tic.push(newMunEntry);
    }

    const newProvEntry = {
        provincia: "Distrito Nacional",
        internet: {
            provincia: "Distrito Nacional",
            total: popTotal,
            used: internetUsed,
            rate_used: internetUsed / popTotal
        },
        cellular: {
            provincia: "Distrito Nacional",
            total: popTotal,
            used: cellularUsed,
            rate_used: cellularUsed / popTotal
        },
        computer: {
            provincia: "Distrito Nacional",
            total: popTotal,
            used: computerUsed,
            rate_used: computerUsed / popTotal
        }
    };

    const existingProvIdx = ticProv.findIndex(e => e.provincia === "Distrito Nacional");
    if (existingProvIdx !== -1) {
        ticProv[existingProvIdx] = newProvEntry;
    } else {
        ticProv.push(newProvEntry);
    }

    fs.writeFileSync("src/data/tic.json", JSON.stringify(tic, null, 2));
    fs.writeFileSync("src/data/tic_provincia.json", JSON.stringify(ticProv, null, 2));
    console.log("Updated tic.json and tic_provincia.json");

} catch (e) {
    console.error(e);
}
