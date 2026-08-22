const User = require('../models/User');
const bcrypt = require('bcryptjs');

const RESERVED_USERNAMES = ['admin', 'login', 'dashboard', 'api', 'profile', 'settings', 'auth', 'home'];

// ==========================================
// 🚀 IN-MEMORY CACHE (5 DAYS SETUP)
// ==========================================
const publicProfileCache = new Map();

// 5 Days in milliseconds
const CACHE_TTL = 5 * 24 * 60 * 60 * 1000; 

// 🧹 Automatic RAM Cleaner: Har 1 Din (24 hours) me ek baar chalega
setInterval(() => {
  const now = Date.now();
  for (let [username, cachedData] of publicProfileCache.entries()) {
    // Agar cache 5 din se purana hai, toh delete kar do
    if (now - cachedData.timestamp > CACHE_TTL) {
      publicProfileCache.delete(username);
    }
  }
  console.log(`[Cache Cleaner] RAM Cleanup Done. Active Profiles in Cache: ${publicProfileCache.size}`);
}, 24 * 60 * 60 * 1000); // 1 Day
// ==========================================


const bufferToDataURI = (file) => {
  const base64String = file.buffer.toString('base64');
  return `data:${file.mimetype};base64,${base64String}`;
};

const validatePassword = (password) => {
  if (!password || String(password).length < 8) return false;
  const passStr = String(password);
  const hasUpper = /[A-Z]/.test(passStr);
  const hasLower = /[a-z]/.test(passStr);
  const hasNumber = /[0-9]/.test(passStr);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(passStr);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

// --- [READ] ---
const getProfile = async (req, res) => {
  try {
    // ⚡ FIX: Added .lean() for faster execution
    const user = await User.findById(req.user).select('-password -otp -otpExpires').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getProfileByUsername = async (req, res) => {
  try {
    const username = req.params.username ? String(req.params.username).toLowerCase().trim() : undefined;
    
    // ⚡ FIX: Check Data in Cache First (DB bypass for ultra-fast response)
    if (publicProfileCache.has(username)) {
      const cachedData = publicProfileCache.get(username);
      // Agar cache purana nahi hua hai (5 din ke andar hai), toh yahi se return kardo
      if (Date.now() - cachedData.timestamp < CACHE_TTL) {
        return res.status(200).json(cachedData.data);
      }
    }

    // ⚡ FIX: Added .lean() to make MongoDB query lighter and faster
    const user = await User.findOne({ username }).select('-password -otp -otpExpires -isVerified').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ⚡ FIX: Save result to cache for subsequent visitors
    publicProfileCache.set(username, { data: user, timestamp: Date.now() });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- [UPDATE] ---
const updateProfile = async (req, res) => {
  try {
    // Sanitize all values immediately to avoid Type Juggling Object attacks
    const name = req.body.name ? String(req.body.name).trim() : undefined;
    const typedText = req.body.typedText !== undefined ? String(req.body.typedText).trim() : undefined;
    const password = req.body.password ? String(req.body.password) : undefined;
    const removeAvatar = req.body.removeAvatar;
    const removeResume = req.body.removeResume;
    
    // Sanitize before checks
    const username = req.body.username ? String(req.body.username).toLowerCase().replace(/[^a-z0-9_]/g, '') : undefined;
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : undefined;

    if (name !== undefined && name === '') return res.status(400).json({ message: 'Full Name cannot be empty!' });
    if (username !== undefined && username === '') return res.status(400).json({ message: 'Username cannot be empty or invalid!' });
    if (email !== undefined && email === '') return res.status(400).json({ message: 'Email cannot be empty!' });

    let updateFields = {};
    
    if (name) updateFields.name = name.replace(/[<>]/g, '');
    if (typedText !== undefined) updateFields.typedText = typedText.replace(/[<>]/g, ''); 

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username && username !== user.username) {
      if (RESERVED_USERNAMES.includes(username)) {
        return res.status(400).json({ message: 'This username is reserved and cannot be used.' });
      }
      const existingUser = await User.findOne({ username, _id: { $ne: req.user } });
      if (existingUser) return res.status(400).json({ message: 'Username is already taken' });
      updateFields.username = username; 
    }
    
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.user } });
      if (existingEmail) return res.status(400).json({ message: 'Email is already taken' });
      updateFields.email = email;
    }

    if (password && password.trim() !== '') {
      if (!validatePassword(password)) {
        return res.status(400).json({ message: 'Password must be min 8 chars long with A-Z, a-z, 0-9, and a special char (!@#$%^&*).' });
      }
      updateFields.password = await bcrypt.hash(password, 10);
    }

    if (removeAvatar === 'true') updateFields.avatar = '';
    if (removeResume === 'true') {
      updateFields.resumeLink = '';
      updateFields.resumeName = '';
    }

    if (req.files) {
      if (req.files.avatar && req.files.avatar[0]) updateFields.avatar = bufferToDataURI(req.files.avatar[0]);
      if (req.files.resume && req.files.resume[0]) {
        updateFields.resumeLink = bufferToDataURI(req.files.resume[0]);
        updateFields.resumeName = req.files.resume[0].originalname;
      }
    }

    // ⚡ FIX: Added .lean()
    const updatedUser = await User.findByIdAndUpdate(req.user, updateFields, { new: true }).select('-password').lean();
    
    // ⚡ FIX: Clear the cache so visitors instantly see the updated profile
    if (updatedUser) {
      publicProfileCache.delete(updatedUser.username);
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

const updateLinks = async (req, res) => {
  const { links } = req.body;
  try {
    if (!Array.isArray(links)) return res.status(400).json({ message: 'Links must be a valid array' });
    
    if (links.length > 50) return res.status(400).json({ message: 'You can only save up to 50 links.' });
    
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const sanitizedLinks = links.map(link => ({
      id: String(link.id).replace(/[<>]/g, ''),
      title: String(link.title).replace(/[<>]/g, '').substring(0, 50),
      url: String(link.url).replace(/[<>]/g, '').substring(0, 500)
    }));

    user.links = sanitizedLinks;
    await user.save();
    
    // ⚡ FIX: Clear the cache so new links are visible instantly
    publicProfileCache.delete(user.username);

    res.status(200).json({ message: 'Links updated successfully', links: user.links });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- [DELETE] ---
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user; 
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Account not found or already deleted.' });
    }
    
    // ⚡ FIX: Clear cache so deleted account stops showing immediately
    publicProfileCache.delete(user.username);

    res.status(200).json({ message: 'Account permanently deleted' });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ message: 'Server error while deleting account.' });
  }
};

module.exports = { getProfile, getProfileByUsername, updateProfile, updateLinks, deleteAccount };