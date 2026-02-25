const xlsx = require("xlsx");
const fs = require("fs");

try {
    const wb = xlsx.readFile("Censo2022/cuadro-2-volumen-iii.xlsx");
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

    const names = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i] && typeof data[i][0] === 'string') {
            const val = data[i][0].trim();
            if (val && val.length > 3 && !val.match(/^[0-9]/)) {
                names.push(val);
            }
        }
    }

    // Print unique values
    console.log([...new Set(names)].join("\n"));
} catch (e) {
    console.error(e);
}
