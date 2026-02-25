const xlsx = require("xlsx");
const fs = require("fs");

try {
    const wb = xlsx.readFile("Censo2022/cuadro-2-volumen-iii.xlsx");
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

    const matches = data.slice(5, 50); // Get the first 45 rows after some headers

    fs.writeFileSync("matches_cuadro2.json", JSON.stringify(matches, null, 2));
    console.log("Wrote top rows.");
} catch (e) {
    console.error(e);
}
