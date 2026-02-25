const xlsx = require("xlsx");
const fs = require("fs");

try {
    const wb2 = xlsx.readFile("Censo2022/cuadro-6-vol-4.xlsx");
    const ws2 = wb2.Sheets[wb2.SheetNames[0]];
    const data2 = xlsx.utils.sheet_to_json(ws2, { header: 1 });

    for (let i = 0; i < data2.length; i++) {
        const r = data2[i] ? data2[i].join(" ") : "";
        if (r.includes("Santo Domingo Este")) {
            console.log("Row:", data2[i]);
            break;
        }
    }
} catch (e) {
    console.error(e);
}
