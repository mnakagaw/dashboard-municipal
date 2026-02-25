const fs = require('fs');

async function main() {
    const pdfjsLib = require('pdfjs-dist');

    const pdfPath = 'Censo2022/Anuario de Indicadores Educativos_2024_6744d70c51248736292987 (1).pdf';
    const dataBuffer = new Uint8Array(fs.readFileSync(pdfPath));

    try {
        const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
        const pdf = await loadingTask.promise;
        console.log(`PDF loaded. Pages: ${pdf.numPages}`);

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(s => s.str).join(' ');

            const lower = pageText.toLowerCase();
            if (lower.includes('distrito nacional') || lower.includes('1503') || lower.includes('surcentral')) {
                console.log(`\n--- Match found on page ${i} ---`);
                console.log(pageText.substring(0, 500) + '...');
                fs.appendFileSync('pdf_page_matches.txt', `\n--- PAGE ${i} ---\n${pageText}\n`);
            }
        }
        console.log("Done checking pages.");
    } catch (err) {
        console.error("Error reading PDF with pdfjs-dist:", err);
    }
}

main();
