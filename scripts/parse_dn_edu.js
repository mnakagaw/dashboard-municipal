const xlsx = require("xlsx");
const fs = require("fs");

try {
    const eduNivel = JSON.parse(fs.readFileSync("src/data/educacion_nivel.json"));
    const eduNivelProv = JSON.parse(fs.readFileSync("src/data/educacion_nivel_provincia.json"));

    const wb = xlsx.readFile("Censo2022/cuadro-1-del-volumen-iv.xlsx");
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

    let startIndex = -1;
    for (let i = 0; i < data.length; i++) {
        const r = data[i] ? data[i].join(" ") : "";
        if (r.toLowerCase().includes("distrito nacional")) {
            startIndex = i;
            break;
        }
    }

    if (startIndex === -1) {
        console.log("Could not find Distrito Nacional.");
    } else {
        console.log("Found at row", startIndex);
        const nivelObj = {};
        const keyMap = {
            "Ninguno": "ninguno",
            "Preprimaria": "preprimaria",
            "Primaria o Básica": "primaria",
            "Secundaria o Media": "secundaria",
            "Universitaria o Superior": "superior"
        };

        for (let i = startIndex + 1; i <= startIndex + 5; i++) {
            if (!data[i] || data[i][0] === undefined) break;
            const row = data[i];
            let label = row[0].toString().trim();
            let k = keyMap[label];
            if (k) {
                nivelObj[k] = {
                    total: row[1] || 0,
                    h: row[2] || 0,
                    m: row[3] || 0,
                    urbano_total: row[4] || 0,
                    urbano_h: row[5] || 0,
                    urbano_m: row[6] || 0,
                    rural_total: row[7] || 0,
                    rural_h: row[8] || 0,
                    rural_m: row[9] || 0
                };
            }
        }

        // Insert into educacion_nivel.json (it's an array of objects)
        const newMunEntry = {
            adm2_code: "01001",
            municipio: "Santo Domingo de Guzmán",
            provincia: "Distrito Nacional",
            region: "Ozama o Metropolitana", // check what region string is expected, usually "Ozama" works or "Ozama o Metropolitana"
            nivel: nivelObj
        };

        // see what region the others use for Ozama - looking at preview, `Santo Domingo Este` uses `Ozama o Metropolitana`
        const existingMunIdx = eduNivel.findIndex(e => e.adm2_code === "01001");
        if (existingMunIdx !== -1) {
            eduNivel[existingMunIdx] = newMunEntry;
        } else {
            eduNivel.push(newMunEntry);
        }

        // Insert into educacion_nivel_provincia.json
        const newProvEntry = {
            provincia: "Distrito Nacional",
            region: "Ozama o Metropolitana",
            nivel: nivelObj
        };

        const existingProvIdx = eduNivelProv.findIndex(e => e.provincia === "Distrito Nacional");
        if (existingProvIdx !== -1) {
            eduNivelProv[existingProvIdx] = newProvEntry;
        } else {
            eduNivelProv.push(newProvEntry);
        }

        fs.writeFileSync("src/data/educacion_nivel.json", JSON.stringify(eduNivel, null, 2));
        fs.writeFileSync("src/data/educacion_nivel_provincia.json", JSON.stringify(eduNivelProv, null, 2));
        console.log("Updated educacion_nivel.json and educacion_nivel_provincia.json");
    }

} catch (e) {
    console.error(e);
}
