async function cleanRawText(rawText) {
  try {
  

    return rawText
      .replace(/\n+/g, ' ') // remove line breaks
      .replace(/\s{2,}/g, ' ') // multiple spaces → one
      .replace(/\[\d{1,2}:\d{2}(?::\d{2})?\]/g, '') // remove [00:12:34]
      .replace(/Page\s?\d+(\sof\s\d+)?/gi, '') // remove 'Page X of Y'
      .replace(/[^\x00-\x7F]/g, '') // remove weird unicode chars
      .trim();
  } catch (error) {
    throw error;
  }
}
export { cleanRawText };
