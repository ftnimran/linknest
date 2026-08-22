const multer = require('multer');

// Memory storage use karenge taaki file buffer se Base64 URL generate ho sake
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith('image/');
  // FIX: Added optional chaining to prevent TypeError crashes on malformed originalnames
  const isPdf = file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf');

  if (file.fieldname === 'avatar' && isImage) {
    cb(null, true);
  } else if (file.fieldname === 'resume' && isPdf) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only Images for Avatar and PDF for Resume are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // MAXIMUM 2MB LIMIT per file
  },
  fileFilter: fileFilter,
});

module.exports = upload;