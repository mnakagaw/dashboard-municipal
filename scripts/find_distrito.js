const xlsx = require("xlsx");
const fs = require("fs");

try {
    const wb = xlsx.readFile("Censo2022/cuadro-2-volumen-iii.xlsx");
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

    for (let i = 0; i < data.length; i++) {
        const rowStr = data[i] ? data[i].join(" ") : "";
        if (rowStr.toLowerCase().includes("distrito") || rowStr.toLowerCase().includes("domingo") || rowStr.toLowerCase().includes("ozama")) {
            console.log(`Row ${i}: ${data[i][0]}`);
        }
    }
} catch (e) {
    console.error(e);
}
