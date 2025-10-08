import fs from 'fs';
const cleanTempFile = async (filePath) => {
  if (!filePath)
    throw new Error('File path is required in cleanTempFile function');
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Temporary file deleted:', filePath);
    }
  } catch (error) {
    throw error;
  }
};
export { cleanTempFile };
