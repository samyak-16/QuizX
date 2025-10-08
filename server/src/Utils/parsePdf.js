import fs from 'fs';

async function extractText(filePath) {
  try {
    // Dynamically import pdf-parse to handle CommonJS module in ESM
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;

    // Read file as buffer
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    return pdfData.text;
  } catch (error) {
    console.error('❌ Error extracting PDF text:', error);
    throw error;
  }
}

export { extractText };
