const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = 'Censo2022/Anuario de Indicadores Educativos_2024_6744d70c51248736292987 (1).pdf';
const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function (data) {
    const text = data.text;
    const lower = text.toLowerCase();

    fs.writeFileSync('pdf_full_text.txt', text);
    console.log("Extracted full text to pdf_full_text.txt. Length: " + text.length);

    // Attempt rudimentary extraction around 1503
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('1503') || lines[i].toLowerCase().includes('surcentral')) {
            console.log("Found match at line " + i + ": " + lines[i]);
            // Print surrounding context
            let start = Math.max(0, i - 15);
            let end = Math.min(lines.length, i + 15);
            let context = lines.slice(start, end).join('\n');
            fs.appendFileSync('pdf_1503_matches.txt', "\n--- MATCH ---\n" + context + "\n");
        }
    }
    console.log("Done checking matches.");
}).catch(function (error) {
    console.error("Error reading PDF:", error);
});
