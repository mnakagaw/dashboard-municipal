const xlsx = require("xlsx");
const fs = require("fs");

try {
    // Read pyramids.json and pyramids_provincia.json
    const pyramids = JSON.parse(fs.readFileSync("src/data/pyramids.json"));
    const pyramidsProv = JSON.parse(fs.readFileSync("src/data/pyramids_provincia.json"));

    const wb = xlsx.readFile("Censo2022/cuadro-2-volumen-iii.xlsx");
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
        console.log("Found Distrito Nacional at row", startIndex);
        const ageGroups = [];
        for (let i = startIndex + 1; i <= startIndex + 22; i++) {
            if (!data[i] || data[i][0] === undefined) break;
            const row = data[i];
            let ageLabel = row[0].toString().trim();

            ageGroups.push({
                age_group: ageLabel,
                male: row[2] || 0,
                female: row[3] || 0
            });
        }

        // Insert into pyramids.json
        pyramids["01001"] = {
            age_groups: ageGroups
        };

        // Insert into pyramids_provincia.json -> it's an array
        const newProvEntry = {
            provincia: "Distrito Nacional",
            age_groups: ageGroups
        };

        // check if exists
        const existingIdx = pyramidsProv.findIndex(p => p.provincia === "Distrito Nacional");
        if (existingIdx !== -1) {
            pyramidsProv[existingIdx] = newProvEntry;
        } else {
            pyramidsProv.push(newProvEntry);
        }

        fs.writeFileSync("src/data/pyramids.json", JSON.stringify(pyramids, null, 2));
        fs.writeFileSync("src/data/pyramids_provincia.json", JSON.stringify(pyramidsProv, null, 2));
        console.log("Updated pyramids.json and pyramids_provincia.json");
    }

} catch (e) {
    console.error(e);
}
