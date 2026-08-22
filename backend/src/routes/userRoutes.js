const express = require('express');
const { 
  getProfile, 
  getProfileByUsername, 
  updateProfile, 
  updateLinks, 
  deleteAccount 
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const router = express.Router();

const handleFileUpload = (req, res, next) => {
  const uploadFields = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'resume', maxCount: 1 }]);
  uploadFields(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size too large! Maximum limit is 2MB.' });
      }
      return res.status(400).json({ message: err.message || 'File upload error.' });
    }
    next();
  });
};

// ==========================================
// CRUD ARCHITECTURE - USER ROUTES
// ==========================================

// [READ]
router.get('/profile', protect, getProfile);
router.get('/u/:username', getProfileByUsername); 

// [UPDATE]
router.put('/profile', protect, handleFileUpload, updateProfile);
router.put('/links', protect, updateLinks);

// [DELETE]
router.delete('/profile', protect, deleteAccount);

module.exports = router;