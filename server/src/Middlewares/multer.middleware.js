import multer from 'multer';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const mainFolders = ['uploads/tempPdf', 'uploads/tempYoutubeAudio'];
mainFolders.forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/pdf');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept PDFs only
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,

  fileFilter: fileFilter,

  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB file size limit for each pdf
});

export { upload };
